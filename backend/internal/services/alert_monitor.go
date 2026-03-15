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

	type coinData struct {
		price     float64
		pctChange float64
	}
	prices := make(map[string]coinData, len(coins))
	for _, c := range coins {
		prices[c.Symbol] = coinData{price: c.Price, pctChange: c.PriceChangePercent24h}
	}

	rows, err := m.db.Query(
		`SELECT id, chat_id, symbol, condition, price, alert_type, threshold FROM alerts WHERE active = 1 AND triggered = 0`,
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
		alertType string
		threshold float64
	}

	var pending []alertRow
	for rows.Next() {
		var a alertRow
		if err := rows.Scan(&a.id, &a.chatID, &a.symbol, &a.condition, &a.price, &a.alertType, &a.threshold); err == nil {
			pending = append(pending, a)
		}
	}
	rows.Close()

	for _, a := range pending {
		data, ok := prices[a.symbol]
		if !ok {
			continue
		}

		var triggered bool
		var msg string

		switch a.alertType {
		case "pct":
			triggered = (a.condition == "pct_above" && data.pctChange >= a.threshold) ||
				(a.condition == "pct_below" && data.pctChange <= -a.threshold)
			if triggered {
				direction := "вырос"
				if a.condition == "pct_below" {
					direction = "упал"
				}
				msg = fmt.Sprintf(
					"🚨 <b>%s</b> %s на <b>%.1f%%</b> за 24ч\nИзменение: <b>%.2f%%</b> | Цена: <b>$%.2f</b>",
					a.symbol, direction, a.threshold, data.pctChange, data.price,
				)
			}
		default: // "price"
			triggered = (a.condition == "above" && data.price >= a.price) ||
				(a.condition == "below" && data.price <= a.price)
			if triggered {
				condText := "выше"
				if a.condition == "below" {
					condText = "ниже"
				}
				msg = fmt.Sprintf(
					"🚨 <b>%s</b> %s $%.2f\nТекущая цена: <b>$%.2f</b>",
					a.symbol, condText, a.price, data.price,
				)
			}
		}

		if !triggered {
			continue
		}

		if err := m.telegram.SendMessage(a.chatID, msg); err != nil {
			log.Printf("AlertMonitor: failed to send to chat %d: %v", a.chatID, err)
			continue
		}
		m.db.Exec(`UPDATE alerts SET triggered = 1 WHERE id = ?`, a.id)
		log.Printf("AlertMonitor: alert %d triggered (%s %s)", a.id, a.symbol, a.condition)
	}
}
