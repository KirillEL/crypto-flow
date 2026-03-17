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

	// Config
	botToken := os.Getenv("TELEGRAM_BOT_TOKEN")
	botName := os.Getenv("TELEGRAM_BOT_NAME")   // e.g. "CryptoFlowBot"
	appName := os.Getenv("TELEGRAM_APP_NAME")   // e.g. "app"
	webhookURL := os.Getenv("TELEGRAM_WEBHOOK_URL") // e.g. "https://cryptoflow.elertka.tech/bot/webhook"

	// Services
	binanceSvc := services.NewBinanceService()
	telegramSvc := services.NewTelegramService(botToken)

	// Register webhook with Telegram
	if webhookURL != "" {
		if err := telegramSvc.SetWebhook(webhookURL); err != nil {
			log.Printf("Warning: failed to set webhook: %v", err)
		}
	}

	// Alert monitor (background goroutine)
	monitor := services.NewAlertMonitor(db, binanceSvc, telegramSvc)
	monitor.Start()

	// Handlers
	coinHandler := handlers.NewCoinHandler(binanceSvc)
	alertHandler := handlers.NewAlertHandler(db, botName, appName)
	portfolioHandler := handlers.NewPortfolioHandler(db)
	webhookHandler := handlers.NewWebhookHandler(db, telegramSvc, botName, appName)
	marketHandler := handlers.NewMarketHandler()

	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(middleware.CORS())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Telegram bot webhook (no rate limit)
	r.POST("/bot/webhook", webhookHandler.Handle)

	api := r.Group("/api")
	{
		api.GET("/coins", coinHandler.GetCoins)
		api.GET("/coins/:symbol/candles", coinHandler.GetCandles)
		api.GET("/coins/:symbol/news", coinHandler.GetNews)
		api.GET("/search", coinHandler.Search)

		api.POST("/alerts", alertHandler.Create)
		api.GET("/alerts", alertHandler.List)
		api.DELETE("/alerts/:id", alertHandler.Delete)
		api.PATCH("/alerts/:id/reset", alertHandler.Reset)

		api.GET("/portfolio", portfolioHandler.List)
		api.POST("/portfolio", portfolioHandler.Create)
		api.PUT("/portfolio/:id", portfolioHandler.Update)
		api.DELETE("/portfolio/:id", portfolioHandler.Delete)

		api.GET("/user/connected", webhookHandler.CheckConnection)

		api.GET("/market", marketHandler.Get)
		api.GET("/market/movers", marketHandler.GetMovers)
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
