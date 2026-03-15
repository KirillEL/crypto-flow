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
	Condition string    `json:"condition"` // "above" | "below"
	Price     float64   `json:"price"`
	Active    bool      `json:"active"`
	Triggered bool      `json:"triggered"`
	CreatedAt time.Time `json:"created_at"`
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
		active     BOOLEAN NOT NULL DEFAULT 1,
		triggered  BOOLEAN NOT NULL DEFAULT 0,
		created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
	)`)
	return db, err
}
