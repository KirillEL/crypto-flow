package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type MarketOverview struct {
	TotalMarketCap     float64 `json:"total_market_cap"`
	MarketCapChange24h float64 `json:"market_cap_change_24h"`
	BtcDominance       float64 `json:"btc_dominance"`
	FearGreedValue     string  `json:"fear_greed_value"`
	FearGreedLabel     string  `json:"fear_greed_label"`
}

type Mover struct {
	Symbol string  `json:"symbol"`
	Price  float64 `json:"price"`
	Change float64 `json:"change"`
}

type MoversResponse struct {
	Gainers []Mover `json:"gainers"`
	Losers  []Mover `json:"losers"`
}

type MarketHandler struct {
	cache           *MarketOverview
	cacheTime       time.Time
	moversCache     *MoversResponse
	moversCacheTime time.Time
	mu              sync.RWMutex
	cacheTTL        time.Duration
	moversCacheTTL  time.Duration
	client          *http.Client
}

func NewMarketHandler() *MarketHandler {
	return &MarketHandler{
		cacheTTL:       5 * time.Minute,
		moversCacheTTL: 5 * time.Minute,
		client:         &http.Client{Timeout: 10 * time.Second},
	}
}

func (h *MarketHandler) Get(c *gin.Context) {
	h.mu.RLock()
	if h.cache != nil && time.Since(h.cacheTime) < h.cacheTTL {
		data := h.cache
		h.mu.RUnlock()
		c.JSON(http.StatusOK, data)
		return
	}
	h.mu.RUnlock()

	overview, err := h.fetch()
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}

	h.mu.Lock()
	h.cache = overview
	h.cacheTime = time.Now()
	h.mu.Unlock()

	c.JSON(http.StatusOK, overview)
}

func (h *MarketHandler) fetch() (*MarketOverview, error) {
	overview := &MarketOverview{}

	// CoinGecko global market data (free, no auth)
	if err := h.fetchCoinGecko(overview); err != nil {
		// non-fatal — return partial data
		fmt.Printf("MarketHandler: coingecko error: %v\n", err)
	}

	// Fear & Greed Index
	if err := h.fetchFearGreed(overview); err != nil {
		fmt.Printf("MarketHandler: fear&greed error: %v\n", err)
	}

	return overview, nil
}

func (h *MarketHandler) fetchCoinGecko(out *MarketOverview) error {
	resp, err := h.client.Get("https://api.coingecko.com/api/v3/global")
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	var result struct {
		Data struct {
			TotalMarketCap        map[string]float64 `json:"total_market_cap"`
			MarketCapChangePercent float64            `json:"market_cap_change_percentage_24h_usd"`
			MarketCapPercentage   map[string]float64 `json:"market_cap_percentage"`
		} `json:"data"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return err
	}

	out.TotalMarketCap = result.Data.TotalMarketCap["usd"]
	out.MarketCapChange24h = result.Data.MarketCapChangePercent
	out.BtcDominance = result.Data.MarketCapPercentage["btc"]
	return nil
}

func (h *MarketHandler) fetchFearGreed(out *MarketOverview) error {
	resp, err := h.client.Get("https://api.alternative.me/fng/?limit=1")
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	var result struct {
		Data []struct {
			Value               string `json:"value"`
			ValueClassification string `json:"value_classification"`
		} `json:"data"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return err
	}

	if len(result.Data) > 0 {
		out.FearGreedValue = result.Data[0].Value
		out.FearGreedLabel = result.Data[0].ValueClassification
	}
	return nil
}

func (h *MarketHandler) GetMovers(c *gin.Context) {
	h.mu.RLock()
	if h.moversCache != nil && time.Since(h.moversCacheTime) < h.moversCacheTTL {
		data := h.moversCache
		h.mu.RUnlock()
		c.JSON(http.StatusOK, data)
		return
	}
	h.mu.RUnlock()

	movers, err := h.fetchMovers()
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}

	h.mu.Lock()
	h.moversCache = movers
	h.moversCacheTime = time.Now()
	h.mu.Unlock()

	c.JSON(http.StatusOK, movers)
}

func (h *MarketHandler) fetchMovers() (*MoversResponse, error) {
	resp, err := h.client.Get("https://api.binance.com/api/v3/ticker/24hr")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var tickers []struct {
		Symbol             string `json:"symbol"`
		LastPrice          string `json:"lastPrice"`
		PriceChangePercent string `json:"priceChangePercent"`
		QuoteVolume        string `json:"quoteVolume"`
	}
	if err := json.Unmarshal(body, &tickers); err != nil {
		return nil, fmt.Errorf("parse error: %w", err)
	}

	type moverCandidate struct {
		symbol string
		price  float64
		change float64
	}

	candidates := make([]moverCandidate, 0, 256)
	for _, t := range tickers {
		if !strings.HasSuffix(t.Symbol, "USDT") {
			continue
		}
		vol, _ := strconv.ParseFloat(t.QuoteVolume, 64)
		if vol < 5_000_000 { // min $5M daily volume
			continue
		}
		price, _ := strconv.ParseFloat(t.LastPrice, 64)
		change, _ := strconv.ParseFloat(t.PriceChangePercent, 64)
		base := t.Symbol[:len(t.Symbol)-4]
		candidates = append(candidates, moverCandidate{symbol: base, price: price, change: change})
	}

	sort.Slice(candidates, func(i, j int) bool {
		return candidates[i].change > candidates[j].change
	})

	take := func(from []moverCandidate, n int) []Mover {
		out := make([]Mover, 0, n)
		for i := 0; i < len(from) && len(out) < n; i++ {
			out = append(out, Mover{Symbol: from[i].symbol, Price: from[i].price, Change: from[i].change})
		}
		return out
	}

	gainers := take(candidates, 5)
	losers := take(reverse(candidates), 5)

	return &MoversResponse{Gainers: gainers, Losers: losers}, nil
}

func reverse[T any](s []T) []T {
	out := make([]T, len(s))
	for i, v := range s {
		out[len(s)-1-i] = v
	}
	return out
}
