package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"cryptoflow/internal/models"

	"github.com/gin-gonic/gin"
)

type AlertHandler struct {
	db *sql.DB
}

func NewAlertHandler(db *sql.DB) *AlertHandler {
	return &AlertHandler{db: db}
}

func (h *AlertHandler) Create(c *gin.Context) {
	var body struct {
		UserID    int64   `json:"user_id" binding:"required"`
		ChatID    int64   `json:"chat_id" binding:"required"`
		Symbol    string  `json:"symbol" binding:"required"`
		Condition string  `json:"condition" binding:"required"`
		Price     float64 `json:"price" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if body.Condition != "above" && body.Condition != "below" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "condition must be 'above' or 'below'"})
		return
	}

	result, err := h.db.Exec(
		`INSERT INTO alerts (user_id, chat_id, symbol, condition, price) VALUES (?, ?, ?, ?, ?)`,
		body.UserID, body.ChatID, body.Symbol, body.Condition, body.Price,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	id, _ := result.LastInsertId()
	c.JSON(http.StatusCreated, gin.H{"id": id})
}

func (h *AlertHandler) List(c *gin.Context) {
	userID, err := strconv.ParseInt(c.Query("user_id"), 10, 64)
	if err != nil || userID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id"})
		return
	}

	rows, err := h.db.Query(
		`SELECT id, user_id, chat_id, symbol, condition, price, active, triggered, created_at
		 FROM alerts WHERE user_id = ? ORDER BY created_at DESC`,
		userID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	alerts := []models.Alert{}
	for rows.Next() {
		var a models.Alert
		if err := rows.Scan(&a.ID, &a.UserID, &a.ChatID, &a.Symbol, &a.Condition, &a.Price, &a.Active, &a.Triggered, &a.CreatedAt); err != nil {
			continue
		}
		alerts = append(alerts, a)
	}
	c.JSON(http.StatusOK, alerts)
}

func (h *AlertHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	h.db.Exec(`DELETE FROM alerts WHERE id = ?`, id)
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *AlertHandler) Reset(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	h.db.Exec(`UPDATE alerts SET triggered = 0 WHERE id = ?`, id)
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
