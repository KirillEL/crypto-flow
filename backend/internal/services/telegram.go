package services

import (
	"fmt"
	"net/http"
	"net/url"
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
