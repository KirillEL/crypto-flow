package services

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"cryptoflow/internal/models"
)

const binanceBaseURL = "https://api.binance.com"

var coinNames = map[string]string{
	"BTC":   "Bitcoin",
	"ETH":   "Ethereum",
	"BNB":   "BNB",
	"SOL":   "Solana",
	"XRP":   "XRP",
	"ADA":   "Cardano",
	"DOGE":  "Dogecoin",
	"AVAX":  "Avalanche",
	"DOT":   "Polkadot",
	"MATIC": "Polygon",
	"LINK":  "Chainlink",
	"UNI":   "Uniswap",
	"ATOM":  "Cosmos",
	"LTC":   "Litecoin",
	"TRX":   "TRON",
}

var defaultSymbols = []string{
	"BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT",
	"ADAUSDT", "DOGEUSDT", "AVAXUSDT", "DOTUSDT", "MATICUSDT",
	"LINKUSDT", "UNIUSDT", "ATOMUSDT", "LTCUSDT", "TRXUSDT",
}

type BinanceService struct {
	client *http.Client
}

func NewBinanceService() *BinanceService {
	return &BinanceService{
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

func (s *BinanceService) get(path string) ([]byte, error) {
	resp, err := s.client.Get(binanceBaseURL + path)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status: %d", resp.StatusCode)
	}
	return io.ReadAll(resp.Body)
}

func parseFloat(s string) float64 {
	v, _ := strconv.ParseFloat(s, 64)
	return v
}

func (s *BinanceService) GetCoins() ([]models.Coin, error) {
	body, err := s.get("/api/v3/ticker/24hr")
	if err != nil {
		return nil, err
	}

	var tickers []models.BinanceTicker
	if err := json.Unmarshal(body, &tickers); err != nil {
		return nil, fmt.Errorf("parse error: %w", err)
	}

	// Filter only our target symbols
	wanted := make(map[string]bool)
	for _, sym := range defaultSymbols {
		wanted[sym] = true
	}

	coins := make([]models.Coin, 0, len(defaultSymbols))
	tickerMap := make(map[string]models.BinanceTicker)
	for _, t := range tickers {
		if wanted[t.Symbol] {
			tickerMap[t.Symbol] = t
		}
	}

	for _, sym := range defaultSymbols {
		t, ok := tickerMap[sym]
		if !ok {
			continue
		}
		base := sym[:len(sym)-4] // strip USDT
		name, ok := coinNames[base]
		if !ok {
			name = base
		}

		// Fetch sparkline (mini 24h chart) — last 24 1h candles
		sparkline, _ := s.getSparkline(sym)

		coins = append(coins, models.Coin{
			Symbol:                base,
			Name:                  name,
			Price:                 parseFloat(t.LastPrice),
			PriceChange24h:        parseFloat(t.PriceChange),
			PriceChangePercent24h: parseFloat(t.PriceChangePercent),
			High24h:               parseFloat(t.HighPrice),
			Low24h:                parseFloat(t.LowPrice),
			Volume24h:             parseFloat(t.QuoteVolume),
			Sparkline:             sparkline,
		})
	}

	return coins, nil
}

func (s *BinanceService) getSparkline(symbol string) ([]float64, error) {
	body, err := s.get(fmt.Sprintf("/api/v3/klines?symbol=%s&interval=1h&limit=24", symbol))
	if err != nil {
		return nil, err
	}

	var raw [][]interface{}
	if err := json.Unmarshal(body, &raw); err != nil {
		return nil, err
	}

	prices := make([]float64, 0, len(raw))
	for _, k := range raw {
		if len(k) > 4 {
			if closeStr, ok := k[4].(string); ok {
				prices = append(prices, parseFloat(closeStr))
			}
		}
	}
	return prices, nil
}

// SearchCoins searches for USDT pairs by symbol prefix (case-insensitive).
func (s *BinanceService) SearchCoins(query string) ([]models.Coin, error) {
	body, err := s.get("/api/v3/ticker/24hr")
	if err != nil {
		return nil, err
	}

	var tickers []models.BinanceTicker
	if err := json.Unmarshal(body, &tickers); err != nil {
		return nil, fmt.Errorf("parse error: %w", err)
	}

	upper := strings.ToUpper(query)
	results := make([]models.Coin, 0, 10)
	for _, t := range tickers {
		if !strings.HasSuffix(t.Symbol, "USDT") {
			continue
		}
		base := t.Symbol[:len(t.Symbol)-4]
		if !strings.HasPrefix(base, upper) {
			continue
		}
		name := coinNames[base]
		if name == "" {
			name = base
		}
		results = append(results, models.Coin{
			Symbol:                base,
			Name:                  name,
			Price:                 parseFloat(t.LastPrice),
			PriceChange24h:        parseFloat(t.PriceChange),
			PriceChangePercent24h: parseFloat(t.PriceChangePercent),
			High24h:               parseFloat(t.HighPrice),
			Low24h:                parseFloat(t.LowPrice),
			Volume24h:             parseFloat(t.QuoteVolume),
		})
		if len(results) >= 10 {
			break
		}
	}
	return results, nil
}

// GetCoin returns a single coin by symbol (without USDT suffix).
func (s *BinanceService) GetCoin(symbol string) (*models.Coin, error) {
	body, err := s.get("/api/v3/ticker/24hr?symbol=" + strings.ToUpper(symbol) + "USDT")
	if err != nil {
		return nil, err
	}

	var t models.BinanceTicker
	if err := json.Unmarshal(body, &t); err != nil {
		return nil, fmt.Errorf("parse error: %w", err)
	}

	base := strings.ToUpper(symbol)
	name := coinNames[base]
	if name == "" {
		name = base
	}
	return &models.Coin{
		Symbol:                base,
		Name:                  name,
		Price:                 parseFloat(t.LastPrice),
		PriceChange24h:        parseFloat(t.PriceChange),
		PriceChangePercent24h: parseFloat(t.PriceChangePercent),
		High24h:               parseFloat(t.HighPrice),
		Low24h:                parseFloat(t.LowPrice),
		Volume24h:             parseFloat(t.QuoteVolume),
	}, nil
}

func (s *BinanceService) GetCandles(symbol, interval string, limit int) ([]models.Candle, error) {
	if limit <= 0 {
		limit = 100
	}
	path := fmt.Sprintf("/api/v3/klines?symbol=%sUSDT&interval=%s&limit=%d", symbol, interval, limit)
	body, err := s.get(path)
	if err != nil {
		return nil, err
	}

	var raw [][]interface{}
	if err := json.Unmarshal(body, &raw); err != nil {
		return nil, fmt.Errorf("parse error: %w", err)
	}

	candles := make([]models.Candle, 0, len(raw))
	for _, k := range raw {
		if len(k) < 6 {
			continue
		}
		openTime, _ := k[0].(float64)
		candles = append(candles, models.Candle{
			Time:   int64(openTime) / 1000,
			Open:   parseFloat(fmt.Sprint(k[1])),
			High:   parseFloat(fmt.Sprint(k[2])),
			Low:    parseFloat(fmt.Sprint(k[3])),
			Close:  parseFloat(fmt.Sprint(k[4])),
			Volume: parseFloat(fmt.Sprint(k[5])),
		})
	}
	return candles, nil
}
