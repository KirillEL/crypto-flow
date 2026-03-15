package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"cryptoflow/internal/models"

	"github.com/gin-gonic/gin"
)

type PortfolioHandler struct {
	db *sql.DB
}

func NewPortfolioHandler(db *sql.DB) *PortfolioHandler {
	return &PortfolioHandler{db: db}
}

func (h *PortfolioHandler) List(c *gin.Context) {
	userID, err := strconv.ParseInt(c.Query("user_id"), 10, 64)
	if err != nil || userID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id"})
		return
	}

	rows, err := h.db.Query(
		`SELECT id, user_id, symbol, amount, entry_price, created_at FROM holdings WHERE user_id = ? ORDER BY created_at DESC`,
		userID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	holdings := []models.Holding{}
	for rows.Next() {
		var h models.Holding
		if err := rows.Scan(&h.ID, &h.UserID, &h.Symbol, &h.Amount, &h.EntryPrice, &h.CreatedAt); err != nil {
			continue
		}
		holdings = append(holdings, h)
	}
	c.JSON(http.StatusOK, holdings)
}

func (h *PortfolioHandler) Create(c *gin.Context) {
	var body struct {
		UserID     int64   `json:"user_id" binding:"required"`
		Symbol     string  `json:"symbol" binding:"required"`
		Amount     float64 `json:"amount" binding:"required"`
		EntryPrice float64 `json:"entry_price" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if body.Amount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "amount must be positive"})
		return
	}
	if body.EntryPrice <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "entry_price must be positive"})
		return
	}

	result, err := h.db.Exec(
		`INSERT INTO holdings (user_id, symbol, amount, entry_price) VALUES (?, ?, ?, ?)`,
		body.UserID, body.Symbol, body.Amount, body.EntryPrice,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	id, _ := result.LastInsertId()
	c.JSON(http.StatusCreated, gin.H{"id": id})
}

func (h *PortfolioHandler) Update(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var body struct {
		Amount     float64 `json:"amount" binding:"required"`
		EntryPrice float64 `json:"entry_price" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	h.db.Exec(`UPDATE holdings SET amount = ?, entry_price = ? WHERE id = ?`, body.Amount, body.EntryPrice, id)
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *PortfolioHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	h.db.Exec(`DELETE FROM holdings WHERE id = ?`, id)
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
