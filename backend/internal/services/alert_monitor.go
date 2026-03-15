package services

import (
	"database/sql"
	"fmt"
	"log"
	"time"
)

type AlertMonitor struct {
	db       *sql.DB
	binance  *BinanceService
	telegram *TelegramService
}

func NewAlertMonitor(db *sql.DB, binance *BinanceService, telegram *TelegramService) *AlertMonitor {
	return &AlertMonitor{db: db, binance: binance, telegram: telegram}
}

func (m *AlertMonitor) Start() {
	go func() {
		for {
			m.check()
			time.Sleep(60 * time.Second)
		}
	}()
}

func (m *AlertMonitor) check() {
	coins, err := m.binance.GetCoins()
	if err != nil {
		log.Printf("AlertMonitor: failed to get coins: %v", err)
		return
	}

	prices := make(map[string]float64, len(coins))
	for _, c := range coins {
		prices[c.Symbol] = c.Price
	}

	rows, err := m.db.Query(
		`SELECT id, chat_id, symbol, condition, price FROM alerts WHERE active = 1 AND triggered = 0`,
	)
	if err != nil {
		log.Printf("AlertMonitor: DB query error: %v", err)
		return
	}

	type alertRow struct {
		id        int64
		chatID    int64
		symbol    string
		condition string
		price     float64
	}

	var pending []alertRow
	for rows.Next() {
		var a alertRow
		if err := rows.Scan(&a.id, &a.chatID, &a.symbol, &a.condition, &a.price); err == nil {
			pending = append(pending, a)
		}
	}
	rows.Close()

	for _, a := range pending {
		current, ok := prices[a.symbol]
		if !ok {
			continue
		}

		triggered := (a.condition == "above" && current >= a.price) ||
			(a.condition == "below" && current <= a.price)

		if !triggered {
			continue
		}

		condText := "выше"
		if a.condition == "below" {
			condText = "ниже"
		}
		msg := fmt.Sprintf(
			"🚨 <b>%s</b> %s $%.2f\nТекущая цена: <b>$%.2f</b>",
			a.symbol, condText, a.price, current,
		)

		if err := m.telegram.SendMessage(a.chatID, msg); err != nil {
			log.Printf("AlertMonitor: failed to send to chat %d: %v", a.chatID, err)
			continue
		}
		m.db.Exec(`UPDATE alerts SET triggered = 1 WHERE id = ?`, a.id)
		log.Printf("AlertMonitor: alert %d triggered (%s %s %.2f)", a.id, a.symbol, a.condition, a.price)
	}
}
