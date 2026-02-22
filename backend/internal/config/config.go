package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	ServerPort   string
	EthRPCUrl    string
	ContractAddr string
	AdminPrivKey string
	CORSOrigins  []string
}

var AppConfig Config

func LoadConfig() error {
	// Load .env file if exists
	godotenv.Load()

	AppConfig = Config{
		ServerPort:   getEnv("SERVER_PORT", "8080"),
		EthRPCUrl:    getEnv("ETH_RPC_URL", "http://127.0.0.1:8545"),
		ContractAddr: getEnv("CONTRACT_ADDRESS", ""),
		AdminPrivKey: getEnv("ADMIN_PRIVATE_KEY", ""),
		CORSOrigins:  []string{getEnv("CORS_ORIGIN", "http://localhost:5173")},
	}

	return nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	valueStr := os.Getenv(key)
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}
	return defaultValue
}
