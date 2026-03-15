package services

import (
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
)

type TelegramService struct {
	token string
}

func NewTelegramService(token string) *TelegramService {
	return &TelegramService{token: token}
}

func (t *TelegramService) SendMessage(chatID int64, text string) error {
	apiURL := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", t.token)
	resp, err := http.PostForm(apiURL, url.Values{
		"chat_id":    {fmt.Sprintf("%d", chatID)},
		"text":       {text},
		"parse_mode": {"HTML"},
	})
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	return nil
}

func (t *TelegramService) SetWebhook(webhookURL string) error {
	if t.token == "" {
		return nil
	}
	apiURL := fmt.Sprintf("https://api.telegram.org/bot%s/setWebhook", t.token)
	resp, err := http.PostForm(apiURL, url.Values{
		"url":             {webhookURL},
		"allowed_updates": {`["message","inline_query"]`},
	})
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	log.Printf("TelegramService: webhook set to %s", webhookURL)
	return nil
}

func (t *TelegramService) AnswerInlineQuery(queryID string, resultsJSON string) error {
	if t.token == "" {
		return nil
	}
	apiURL := fmt.Sprintf("https://api.telegram.org/bot%s/answerInlineQuery", t.token)
	resp, err := http.Post(apiURL, "application/x-www-form-urlencoded",
		strings.NewReader(url.Values{
			"inline_query_id": {queryID},
			"results":         {resultsJSON},
			"cache_time":      {"10"},
		}.Encode()),
	)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	return nil
}
