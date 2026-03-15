package handlers

import (
	"net/http"
	"strconv"
	"sync"
	"time"

	"cryptoflow/internal/models"
	"cryptoflow/internal/services"

	"github.com/gin-gonic/gin"
)

type CoinHandler struct {
	svc       *services.BinanceService
	cache     []models.Coin
	cacheTime time.Time
	mu        sync.RWMutex
	cacheTTL  time.Duration
}

func NewCoinHandler(svc *services.BinanceService) *CoinHandler {
	return &CoinHandler{
		svc:      svc,
		cacheTTL: 15 * time.Second,
	}
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
