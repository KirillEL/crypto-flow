package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type MarketOverview struct {
	TotalMarketCap    float64 `json:"total_market_cap"`
	MarketCapChange24h float64 `json:"market_cap_change_24h"`
	BtcDominance      float64 `json:"btc_dominance"`
	FearGreedValue    string  `json:"fear_greed_value"`
	FearGreedLabel    string  `json:"fear_greed_label"`
}

type MarketHandler struct {
	cache     *MarketOverview
	cacheTime time.Time
	mu        sync.RWMutex
	cacheTTL  time.Duration
	client    *http.Client
}

func NewMarketHandler() *MarketHandler {
	return &MarketHandler{
		cacheTTL: 5 * time.Minute,
		client:   &http.Client{Timeout: 10 * time.Second},
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
