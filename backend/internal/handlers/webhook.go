package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"cryptoflow/internal/services"

	"github.com/gin-gonic/gin"
)

type WebhookHandler struct {
	db       *sql.DB
	telegram *services.TelegramService
	botName  string
	appName  string
}

func NewWebhookHandler(db *sql.DB, telegram *services.TelegramService, botName, appName string) *WebhookHandler {
	return &WebhookHandler{db: db, telegram: telegram, botName: botName, appName: appName}
}

// Telegram update types (minimal subset we need)
type tgUpdate struct {
	UpdateID    int64       `json:"update_id"`
	Message     *tgMessage  `json:"message"`
	InlineQuery *tgInlineQ  `json:"inline_query"`
}

type tgMessage struct {
	MessageID int64  `json:"message_id"`
	From      tgUser `json:"from"`
	Chat      tgChat `json:"chat"`
	Text      string `json:"text"`
}

type tgUser struct {
	ID        int64  `json:"id"`
	FirstName string `json:"first_name"`
	Username  string `json:"username"`
}

type tgChat struct {
	ID int64 `json:"id"`
}

type tgInlineQ struct {
	ID   string `json:"id"`
	From tgUser `json:"from"`
	Query string `json:"query"`
}

func (h *WebhookHandler) Handle(c *gin.Context) {
	var update tgUpdate
	if err := c.ShouldBindJSON(&update); err != nil {
		c.Status(http.StatusOK) // always 200 to Telegram
		return
	}

	if update.Message != nil {
		h.handleMessage(update.Message)
	}

	if update.InlineQuery != nil {
		h.handleInlineQuery(update.InlineQuery)
	}

	c.Status(http.StatusOK)
}

func (h *WebhookHandler) handleMessage(msg *tgMessage) {
	text := strings.TrimSpace(msg.Text)
	if !strings.HasPrefix(text, "/") {
		return
	}

	parts := strings.Fields(text)
	command := strings.ToLower(strings.Split(parts[0], "@")[0]) // strip @botname suffix

	switch command {
	case "/start":
		h.handleStart(msg, parts)
	case "/link":
		h.handleLink(msg, parts)
	case "/price":
		h.handlePrice(msg, parts)
	}
}

func (h *WebhookHandler) handleStart(msg *tgMessage, parts []string) {
	// /start connect_{user_id}
	if len(parts) >= 2 && strings.HasPrefix(parts[1], "connect_") {
		userIDStr := strings.TrimPrefix(parts[1], "connect_")
		var userID int64
		if _, err := fmt.Sscanf(userIDStr, "%d", &userID); err != nil || userID == 0 {
			return
		}

		_, err := h.db.Exec(
			`INSERT INTO user_chats (user_id, chat_id) VALUES (?, ?)
			 ON CONFLICT(user_id) DO UPDATE SET chat_id = excluded.chat_id`,
			userID, msg.Chat.ID,
		)
		if err != nil {
			log.Printf("Webhook: failed to save user_chat: %v", err)
			h.telegram.SendMessage(msg.Chat.ID, "❌ Ошибка при подключении. Попробуйте ещё раз.")
			return
		}

		h.telegram.SendMessage(msg.Chat.ID,
			fmt.Sprintf("✅ <b>Бот подключён!</b>\n\nТеперь вы будете получать уведомления об алертах прямо здесь.\n\n<a href=\"https://t.me/%s/%s\">Открыть CryptoFlow</a>", h.botName, h.appName),
		)
		return
	}

	// /start ref_{referrer_id}
	if len(parts) >= 2 && strings.HasPrefix(parts[1], "ref_") {
		// handled by frontend via start_param; bot just sends welcome
	}

	// /start coin_{symbol}
	if len(parts) >= 2 && strings.HasPrefix(parts[1], "coin_") {
		symbol := strings.TrimPrefix(parts[1], "coin_")
		h.telegram.SendMessage(msg.Chat.ID,
			fmt.Sprintf("📈 Отслеживай <b>%s</b> в CryptoFlow!\n\n<a href=\"https://t.me/%s/%s?startapp=coin_%s\">Открыть</a>", symbol, h.botName, h.appName, symbol),
		)
		return
	}

	h.telegram.SendMessage(msg.Chat.ID,
		fmt.Sprintf("👋 <b>Привет!</b>\n\nCryptoFlow — отслеживай цены 200+ монет в реальном времени.\n\n<a href=\"https://t.me/%s/%s\">Открыть приложение</a>", h.botName, h.appName),
	)
}

func (h *WebhookHandler) handleLink(msg *tgMessage, parts []string) {
	// /link {user_id} — links alerts to current chat (personal or group)
	if len(parts) < 2 {
		h.telegram.SendMessage(msg.Chat.ID, "Usage: /link {your_user_id}\n\nFind your ID in the CryptoFlow app → Alerts tab.")
		return
	}
	var userID int64
	if _, err := fmt.Sscanf(parts[1], "%d", &userID); err != nil || userID == 0 {
		h.telegram.SendMessage(msg.Chat.ID, "❌ Invalid user ID. Copy it from the CryptoFlow app.")
		return
	}
	_, err := h.db.Exec(
		`INSERT INTO user_chats (user_id, chat_id) VALUES (?, ?)
		 ON CONFLICT(user_id) DO UPDATE SET chat_id = excluded.chat_id`,
		userID, msg.Chat.ID,
	)
	if err != nil {
		log.Printf("Webhook: handleLink failed: %v", err)
		h.telegram.SendMessage(msg.Chat.ID, "❌ Failed to link. Please try again.")
		return
	}
	h.telegram.SendMessage(msg.Chat.ID,
		fmt.Sprintf("✅ <b>Linked!</b>\n\nAlerts will now be sent to this chat.\n\n<a href=\"https://t.me/%s/%s\">Open CryptoFlow</a>", h.botName, h.appName),
	)
}

func (h *WebhookHandler) handlePrice(msg *tgMessage, parts []string) {
	if len(parts) < 2 {
		h.telegram.SendMessage(msg.Chat.ID, "Использование: /price BTC")
		return
	}
	symbol := strings.ToUpper(parts[1])
	h.telegram.SendMessage(msg.Chat.ID,
		fmt.Sprintf("📊 Цена <b>%s</b> загружается...\n\n<a href=\"https://t.me/%s/%s?startapp=coin_%s\">Смотреть в CryptoFlow</a>", symbol, h.botName, h.appName, symbol),
	)
}

func (h *WebhookHandler) handleInlineQuery(q *tgInlineQ) {
	if q.Query == "" {
		return
	}
	symbol := strings.ToUpper(strings.TrimSpace(q.Query))

	result := map[string]interface{}{
		"type":                  "article",
		"id":                    symbol,
		"title":                 symbol + " — смотреть в CryptoFlow",
		"description":           "Открыть график и цену в реальном времени",
		"input_message_content": map[string]interface{}{
			"message_text": fmt.Sprintf("📈 <b>%s</b>\nСмотри цену в реальном времени!\n<a href=\"https://t.me/%s/%s?startapp=coin_%s\">Открыть CryptoFlow</a>", symbol, h.botName, h.appName, symbol),
			"parse_mode":   "HTML",
		},
		"reply_markup": map[string]interface{}{
			"inline_keyboard": [][]map[string]interface{}{
				{{
					"text": "📊 Открыть " + symbol,
					"url":  fmt.Sprintf("https://t.me/%s/%s?startapp=coin_%s", h.botName, h.appName, symbol),
				}},
			},
		},
	}

	results, _ := json.Marshal([]interface{}{result})
	h.telegram.AnswerInlineQuery(q.ID, string(results))
}

// CheckConnection returns whether this user has connected the bot
func (h *WebhookHandler) CheckConnection(c *gin.Context) {
	var userID int64
	if _, err := fmt.Sscanf(c.Query("user_id"), "%d", &userID); err != nil || userID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id"})
		return
	}

	var chatID int64
	err := h.db.QueryRow(`SELECT chat_id FROM user_chats WHERE user_id = ?`, userID).Scan(&chatID)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusOK, gin.H{"connected": false})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"connected": true, "chat_id": chatID})
}
