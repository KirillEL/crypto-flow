package models

type Coin struct {
	Symbol               string    `json:"symbol"`
	Name                 string    `json:"name"`
	Price                float64   `json:"price"`
	PriceChange24h       float64   `json:"priceChange24h"`
	PriceChangePercent24h float64  `json:"priceChangePercent24h"`
	High24h              float64   `json:"high24h"`
	Low24h               float64   `json:"low24h"`
	Volume24h            float64   `json:"volume24h"`
	MarketCap            float64   `json:"marketCap,omitempty"`
	Sparkline            []float64 `json:"sparkline,omitempty"`
}

type Candle struct {
	Time   int64   `json:"time"`
	Open   float64 `json:"open"`
	High   float64 `json:"high"`
	Low    float64 `json:"low"`
	Close  float64 `json:"close"`
	Volume float64 `json:"volume"`
}

type BinanceTicker struct {
	Symbol             string `json:"symbol"`
	PriceChange        string `json:"priceChange"`
	PriceChangePercent string `json:"priceChangePercent"`
	LastPrice          string `json:"lastPrice"`
	HighPrice          string `json:"highPrice"`
	LowPrice           string `json:"lowPrice"`
	Volume             string `json:"volume"`
	QuoteVolume        string `json:"quoteVolume"`
}

type BinanceKline struct {
	OpenTime  int64  `json:"openTime"`
	Open      string `json:"open"`
	High      string `json:"high"`
	Low       string `json:"low"`
	Close     string `json:"close"`
	Volume    string `json:"volume"`
	CloseTime int64  `json:"closeTime"`
}
