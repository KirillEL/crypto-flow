package main

import (
	"log"
	"os"

	"cryptoflow/internal/handlers"
	"cryptoflow/internal/middleware"
	"cryptoflow/internal/models"
	"cryptoflow/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	// SQLite
	db, err := models.InitDB("/data/alerts.db")
	if err != nil {
		log.Fatalf("Failed to init DB: %v", err)
	}
	defer db.Close()

	// Services
	binanceSvc := services.NewBinanceService()
	telegramSvc := services.NewTelegramService(os.Getenv("TELEGRAM_BOT_TOKEN"))

	// Alert monitor (background goroutine)
	monitor := services.NewAlertMonitor(db, binanceSvc, telegramSvc)
	monitor.Start()

	// Handlers
	coinHandler := handlers.NewCoinHandler(binanceSvc)
	alertHandler := handlers.NewAlertHandler(db)

	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(middleware.CORS())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	api := r.Group("/api")
	{
		api.GET("/coins", coinHandler.GetCoins)
		api.GET("/coins/:symbol/candles", coinHandler.GetCandles)

		api.POST("/alerts", alertHandler.Create)
		api.GET("/alerts", alertHandler.List)
		api.DELETE("/alerts/:id", alertHandler.Delete)
		api.PATCH("/alerts/:id/reset", alertHandler.Reset)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("CryptoFlow backend starting on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
