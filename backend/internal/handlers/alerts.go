package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"strconv"

	"cryptoflow/internal/models"

	"github.com/gin-gonic/gin"
)

type AlertHandler struct {
	db      *sql.DB
	botName string
	appName string
}

func NewAlertHandler(db *sql.DB, botName, appName string) *AlertHandler {
	return &AlertHandler{db: db, botName: botName, appName: appName}
}

func (h *AlertHandler) Create(c *gin.Context) {
	var body struct {
		UserID    int64   `json:"user_id" binding:"required"`
		Symbol    string  `json:"symbol" binding:"required"`
		Condition string  `json:"condition" binding:"required"`
		Price     float64 `json:"price"`
		AlertType string  `json:"alert_type"`
		Threshold float64 `json:"threshold"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Determine alert type
	alertType := body.AlertType
	if alertType == "" {
		alertType = "price"
	}

	if alertType == "price" {
		if body.Condition != "above" && body.Condition != "below" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "condition must be 'above' or 'below'"})
			return
		}
		if body.Price <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "price must be positive"})
			return
		}
	} else if alertType == "pct" {
		if body.Condition != "pct_above" && body.Condition != "pct_below" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "condition must be 'pct_above' or 'pct_below'"})
			return
		}
		if body.Threshold <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "threshold must be positive"})
			return
		}
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "alert_type must be 'price' or 'pct'"})
		return
	}

	// Look up chat_id from user_chats
	var chatID int64
	err := h.db.QueryRow(`SELECT chat_id FROM user_chats WHERE user_id = ?`, body.UserID).Scan(&chatID)
	if err == sql.ErrNoRows {
		connectURL := fmt.Sprintf("https://t.me/%s?start=connect_%d", h.botName, body.UserID)
		c.JSON(http.StatusPaymentRequired, gin.H{
			"error":       "not_connected",
			"connect_url": connectURL,
		})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	result, err := h.db.Exec(
		`INSERT INTO alerts (user_id, chat_id, symbol, condition, price, alert_type, threshold) VALUES (?, ?, ?, ?, ?, ?, ?)`,
		body.UserID, chatID, body.Symbol, body.Condition, body.Price, alertType, body.Threshold,
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
		`SELECT id, user_id, chat_id, symbol, condition, price, alert_type, threshold, active, triggered, created_at
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
		if err := rows.Scan(&a.ID, &a.UserID, &a.ChatID, &a.Symbol, &a.Condition, &a.Price, &a.AlertType, &a.Threshold, &a.Active, &a.Triggered, &a.CreatedAt); err != nil {
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
