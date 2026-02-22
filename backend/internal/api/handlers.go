package api
import (
	"fmt"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"voting-dapp/backend/internal/blockchain"
	"voting-dapp/backend/internal/config"
	"voting-dapp/backend/internal/models"
)

import (
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"voting-dapp/backend/internal/blockchain"
	"voting-dapp/backend/internal/config"
	"voting-dapp/backend/internal/models"
)

var ethClient *blockchain.Client

// SetupRouter initializes the API router
func SetupRouter(client *blockchain.Client) *gin.Engine {
	ethClient = client

	router := gin.Default()

	// CORS middleware
	router.Use(cors.New(cors.Config{
		AllowOrigins:     config.AppConfig.CORSOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// API routes
	api := router.Group("/api")
	{
		// Health check
		api.GET("/health", healthCheck)

		// Contract info
		api.GET("/contract", getContractInfo)

		// Poll routes
		polls := api.Group("/polls")
		{
			polls.GET("", getAllPolls)
			polls.GET("/:id", getPoll)
			polls.GET("/:id/results", getPollResults)
			polls.GET("/:id/status", getPollStatus)
			polls.POST("", createPoll)
			polls.POST("/:id/cancel", cancelPoll)
			polls.POST("/:id/activate", activatePoll)
			polls.POST("/:id/deactivate", deactivatePoll)
		}

		// Voting routes
		votes := api.Group("/votes")
		{
			votes.POST("", castVote)
			votes.GET("/:pollId/voter/:address", getVoterStatus)
		}

		// Voting power routes
		power := api.Group("/voting-power")
		{
			power.GET("/:address", getVotingPower)
			power.POST("/assign", assignVotingPower)
			power.POST("/assign-batch", batchAssignVotingPower)
		}
	}

	return router
}

// healthCheck returns server health status
func healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    gin.H{"status": "healthy"},
	})
}

// getContractInfo returns contract information
func getContractInfo(c *gin.Context) {
	admin, err := ethClient.GetAdmin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data: models.ContractInfo{
			Address: ethClient.GetContractAddress(),
			Admin:   admin,
		},
	})
}

// getAllPolls returns all poll IDs
func getAllPolls(c *gin.Context) {
	ids, err := ethClient.GetAllPollIds()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	polls := make([]*models.Poll, 0, len(ids))
	for _, id := range ids {
		poll, err := ethClient.GetPoll(id)
		if err != nil {
			continue
		}
		polls = append(polls, poll)
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    polls,
	})
}

// getPoll returns a specific poll
func getPoll(c *gin.Context) {
	pollID := c.Param("id")
	var id uint64
	if _, err := fmt.Sscanf(pollID, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Invalid poll ID",
		})
		return
	}

	poll, err := ethClient.GetPoll(id)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    poll,
	})
}

// getPollResults returns poll results
func getPollResults(c *gin.Context) {
	pollID := c.Param("id")
	var id uint64
	if _, err := fmt.Sscanf(pollID, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Invalid poll ID",
		})
		return
	}

	results, err := ethClient.GetPollResults(id)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    results,
	})
}

// getPollStatus returns poll status
func getPollStatus(c *gin.Context) {
	pollID := c.Param("id")
	var id uint64
	if _, err := fmt.Sscanf(pollID, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Invalid poll ID",
		})
		return
	}

	status, err := ethClient.GetPollStatus(id)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data: models.PollStatus{
			PollID: id,
			Status: status,
		},
	})
}

// createPoll creates a new poll
func createPoll(c *gin.Context) {
	var req models.CreatePollRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	pollID, err := ethClient.CreatePoll(
		req.Title,
		req.Description,
		req.Options,
		req.StartTime,
		req.EndTime,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Data: gin.H{
			"pollId": pollID,
		},
	})
}

// cancelPoll cancels a poll
func cancelPoll(c *gin.Context) {
	pollID := c.Param("id")
	var id uint64
	if _, err := fmt.Sscanf(pollID, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Invalid poll ID",
		})
		return
	}

	if err := ethClient.CancelPoll(id); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    gin.H{"message": "Poll canceled successfully"},
	})
}

// activatePoll activates a poll
func activatePoll(c *gin.Context) {
	pollID := c.Param("id")
	var id uint64
	if _, err := fmt.Sscanf(pollID, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Invalid poll ID",
		})
		return
	}

	if err := ethClient.ActivatePoll(id); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    gin.H{"message": "Poll activated successfully"},
	})
}

// deactivatePoll deactivates a poll
func deactivatePoll(c *gin.Context) {
	pollID := c.Param("id")
	var id uint64
	if _, err := fmt.Sscanf(pollID, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Invalid poll ID",
		})
		return
	}

	if err := ethClient.DeactivatePoll(id); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    gin.H{"message": "Poll deactivated successfully"},
	})
}

// castVote casts a vote
func castVote(c *gin.Context) {
	var req models.VoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	if err := ethClient.Vote(req.PollID, req.OptionIndex); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    gin.H{"message": "Vote cast successfully"},
	})
}

// getVoterStatus returns voter status for a poll
func getVoterStatus(c *gin.Context) {
	pollID := c.Param("pollId")
	voter := c.Param("address")

	var id uint64
	if _, err := fmt.Sscanf(pollID, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Invalid poll ID",
		})
		return
	}

	status, err := ethClient.GetVoterStatus(id, voter)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    status,
	})
}

// getVotingPower returns voting power for an address
func getVotingPower(c *gin.Context) {
	address := c.Param("address")

	power, err := ethClient.GetVotingPower(address)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data: gin.H{
			"address": address,
			"power":   power,
		},
	})
}

// assignVotingPower assigns voting power to a voter
func assignVotingPower(c *gin.Context) {
	var req models.AssignVotingPowerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	if err := ethClient.AssignVotingPower(req.Voter, req.Power); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    gin.H{"message": "Voting power assigned successfully"},
	})
}

// batchAssignVotingPower batch assigns voting power
func batchAssignVotingPower(c *gin.Context) {
	var req models.BatchAssignVotingPowerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	if len(req.Voters) != len(req.Powers) {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Voters and powers arrays must have same length",
		})
		return
	}

	if err := ethClient.BatchAssignVotingPower(req.Voters, req.Powers); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    gin.H{"message": "Voting powers assigned successfully"},
	})
}
