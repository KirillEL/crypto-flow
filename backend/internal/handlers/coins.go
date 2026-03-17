package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"cryptoflow/internal/models"
	"cryptoflow/internal/services"

	"github.com/gin-gonic/gin"
)

type NewsArticle struct {
	Title       string `json:"title"`
	URL         string `json:"url"`
	Source      string `json:"source"`
	ImageURL    string `json:"image_url"`
	PublishedAt int64  `json:"published_at"`
}

type newsCacheEntry struct {
	articles []NewsArticle
	fetchedAt time.Time
}

type CoinHandler struct {
	svc        *services.BinanceService
	cache      []models.Coin
	cacheTime  time.Time
	newsCache  map[string]newsCacheEntry
	mu         sync.RWMutex
	cacheTTL   time.Duration
	newsTTL    time.Duration
	httpClient *http.Client
}

func NewCoinHandler(svc *services.BinanceService) *CoinHandler {
	return &CoinHandler{
		svc:        svc,
		cacheTTL:   15 * time.Second,
		newsTTL:    10 * time.Minute,
		newsCache:  make(map[string]newsCacheEntry),
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

func (h *CoinHandler) GetNews(c *gin.Context) {
	symbol := strings.ToUpper(c.Param("symbol"))

	h.mu.RLock()
	if entry, ok := h.newsCache[symbol]; ok && time.Since(entry.fetchedAt) < h.newsTTL {
		articles := entry.articles
		h.mu.RUnlock()
		c.JSON(http.StatusOK, articles)
		return
	}
	h.mu.RUnlock()

	articles, err := h.fetchNews(symbol)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}

	h.mu.Lock()
	h.newsCache[symbol] = newsCacheEntry{articles: articles, fetchedAt: time.Now()}
	h.mu.Unlock()

	c.JSON(http.StatusOK, articles)
}

func (h *CoinHandler) fetchNews(symbol string) ([]NewsArticle, error) {
	url := fmt.Sprintf(
		"https://min-api.cryptocompare.com/data/v2/news/?categories=%s&sortOrder=popular&limit=10",
		symbol,
	)
	resp, err := h.httpClient.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result struct {
		Data []struct {
			Title      string `json:"title"`
			URL        string `json:"url"`
			Source     string `json:"source"`
			ImageURL   string `json:"imageurl"`
			PublishedOn int64 `json:"published_on"`
			SourceInfo struct {
				Name string `json:"name"`
			} `json:"source_info"`
		} `json:"Data"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("parse error: %w", err)
	}

	articles := make([]NewsArticle, 0, len(result.Data))
	for _, d := range result.Data {
		sourceName := d.SourceInfo.Name
		if sourceName == "" {
			sourceName = d.Source
		}
		articles = append(articles, NewsArticle{
			Title:       d.Title,
			URL:         d.URL,
			Source:      sourceName,
			ImageURL:    d.ImageURL,
			PublishedAt: d.PublishedOn,
		})
	}
	return articles, nil
}

func (h *CoinHandler) GetCoins(c *gin.Context) {
	h.mu.RLock()
	if h.cache != nil && time.Since(h.cacheTime) < h.cacheTTL {
		coins := h.cache
		h.mu.RUnlock()
		c.JSON(http.StatusOK, coins)
		return
	}
	h.mu.RUnlock()

	coins, err := h.svc.GetCoins()
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}

	h.mu.Lock()
	h.cache = coins
	h.cacheTime = time.Now()
	h.mu.Unlock()

	c.JSON(http.StatusOK, coins)
}

func (h *CoinHandler) Search(c *gin.Context) {
	q := c.Query("q")
	if len(q) < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "q is required"})
		return
	}
	results, err := h.svc.SearchCoins(q)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, results)
}

func (h *CoinHandler) GetCandles(c *gin.Context) {
	symbol := c.Param("symbol")
	interval := c.DefaultQuery("interval", "1h")
	limitStr := c.DefaultQuery("limit", "100")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 100
	}
	if limit > 500 {
		limit = 500
	}

	// Validate interval
	validIntervals := map[string]bool{
		"1m": true, "3m": true, "5m": true, "15m": true, "30m": true,
		"1h": true, "2h": true, "4h": true, "6h": true, "8h": true, "12h": true,
		"1d": true, "3d": true, "1w": true, "1M": true,
	}
	if !validIntervals[interval] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid interval"})
		return
	}

	candles, err := h.svc.GetCandles(symbol, interval, limit)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, candles)
}
