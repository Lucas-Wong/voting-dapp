package main

import (
	"log"
	"voting-dapp/backend/internal/api"
	"voting-dapp/backend/internal/blockchain"
	"voting-dapp/backend/internal/config"
)

func main() {
	// Load configuration
	if err := config.LoadConfig(); err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	log.Printf("Starting Voting DApp Backend...")
	log.Printf("RPC URL: %s", config.AppConfig.EthRPCUrl)
	log.Printf("Contract: %s", config.AppConfig.ContractAddr)

	// Initialize blockchain client
	ethClient, err := blockchain.NewClient(
		config.AppConfig.EthRPCUrl,
		config.AppConfig.ContractAddr,
		config.AppConfig.AdminPrivKey,
	)
	if err != nil {
		log.Fatalf("Failed to connect to blockchain: %v", err)
	}
	defer ethClient.Close()

	log.Printf("Connected to blockchain successfully")

	// Setup and start API server
	router := api.SetupRouter(ethClient)

	log.Printf("Server starting on port %s", config.AppConfig.ServerPort)
	if err := router.Run(":" + config.AppConfig.ServerPort); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
