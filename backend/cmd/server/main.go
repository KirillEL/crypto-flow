package main

import (
	"log"
	"os"

	"cryptoflow/internal/handlers"
	"cryptoflow/internal/middleware"
	"cryptoflow/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env if present
	_ = godotenv.Load()

	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	binanceSvc := services.NewBinanceService()
	coinHandler := handlers.NewCoinHandler(binanceSvc)

	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(middleware.CORS())

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API routes
	api := r.Group("/api")
	{
		api.GET("/coins", coinHandler.GetCoins)
		api.GET("/coins/:symbol/candles", coinHandler.GetCandles)
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
