package models

import (
	"database/sql"
	"time"

	_ "modernc.org/sqlite"
)

type Alert struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"user_id"`
	ChatID    int64     `json:"chat_id"`
	Symbol    string    `json:"symbol"`
	Condition string    `json:"condition"` // "above" | "below" | "pct_above" | "pct_below"
	Price     float64   `json:"price"`
	AlertType string    `json:"alert_type"` // "price" | "pct"
	Threshold float64   `json:"threshold"`  // % threshold for pct alerts
	Active    bool      `json:"active"`
	Triggered bool      `json:"triggered"`
	CreatedAt time.Time `json:"created_at"`
}

type Holding struct {
	ID         int64     `json:"id"`
	UserID     int64     `json:"user_id"`
	Symbol     string    `json:"symbol"`
	Amount     float64   `json:"amount"`
	EntryPrice float64   `json:"entry_price"`
	CreatedAt  time.Time `json:"created_at"`
}

func InitDB(path string) (*sql.DB, error) {
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}

	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS alerts (
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id    INTEGER NOT NULL,
		chat_id    INTEGER NOT NULL,
		symbol     TEXT NOT NULL,
		condition  TEXT NOT NULL,
		price      REAL NOT NULL,
		alert_type TEXT NOT NULL DEFAULT 'price',
		threshold  REAL NOT NULL DEFAULT 0,
		active     BOOLEAN NOT NULL DEFAULT 1,
		triggered  BOOLEAN NOT NULL DEFAULT 0,
		created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
	)`)
	if err != nil {
		return nil, err
	}

	// Migrate existing DB — ignore errors if columns already exist
	db.Exec(`ALTER TABLE alerts ADD COLUMN alert_type TEXT NOT NULL DEFAULT 'price'`)
	db.Exec(`ALTER TABLE alerts ADD COLUMN threshold REAL NOT NULL DEFAULT 0`)

	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS user_chats (
		user_id INTEGER PRIMARY KEY,
		chat_id INTEGER NOT NULL
	)`)
	if err != nil {
		return nil, err
	}

	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS holdings (
		id          INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id     INTEGER NOT NULL,
		symbol      TEXT NOT NULL,
		amount      REAL NOT NULL,
		entry_price REAL NOT NULL,
		created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
	)`)
	if err != nil {
		return nil, err
	}

	return db, nil
}
