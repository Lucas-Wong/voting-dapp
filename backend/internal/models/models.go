package models

import "time"

// Poll represents a voting poll
type Poll struct {
	ID          uint64   `json:"id"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Options     []string `json:"options"`
	StartTime   int64    `json:"startTime"`
	EndTime     int64    `json:"endTime"`
	Creator     string   `json:"creator"`
	IsActive    bool     `json:"isActive"`
	IsCanceled  bool     `json:"isCanceled"`
	TotalVotes  uint64   `json:"totalVotes"`
}

// PollResults represents the results of a poll
type PollResults struct {
	PollID     uint64   `json:"pollId"`
	Options    []string `json:"options"`
	VoteCounts []uint64 `json:"voteCounts"`
	TotalVotes uint64   `json:"totalVotes"`
}

// Vote represents a single vote
type Vote struct {
	PollID      uint64 `json:"pollId"`
	OptionIndex uint64 `json:"optionIndex"`
	Voter       string `json:"voter"`
	Timestamp   int64  `json:"timestamp"`
	Weight      uint64 `json:"weight"`
}

// CreatePollRequest is the request body for creating a poll
type CreatePollRequest struct {
	Title       string   `json:"title" binding:"required"`
	Description string   `json:"description"`
	Options     []string `json:"options" binding:"required,min=2"`
	StartTime   int64    `json:"startTime" binding:"required"`
	EndTime     int64    `json:"endTime" binding:"required"`
}

// VoteRequest is the request body for casting a vote
type VoteRequest struct {
	PollID      uint64 `json:"pollId" binding:"required"`
	OptionIndex uint64 `json:"optionIndex" binding:"required"`
}

// AssignVotingPowerRequest is the request body for assigning voting power
type AssignVotingPowerRequest struct {
	Voter string `json:"voter" binding:"required"`
	Power uint64 `json:"power" binding:"required"`
}

// BatchAssignVotingPowerRequest is the request body for batch assigning voting power
type BatchAssignVotingPowerRequest struct {
	Voters []string `json:"voters" binding:"required"`
	Powers []uint64 `json:"powers" binding:"required"`
}

// VoterStatus represents a voter's status in a poll
type VoterStatus struct {
	HasVoted    bool   `json:"hasVoted"`
	OptionIndex uint64 `json:"optionIndex,omitempty"`
	VotingPower uint64 `json:"votingPower"`
}

// PollStatus represents the status of a poll
type PollStatus struct {
	PollID uint64 `json:"pollId"`
	Status string `json:"status"`
}

// APIResponse is a generic API response
type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// ErrorResponse is an error response
type ErrorResponse struct {
	Success bool   `json:"success"`
	Error   string `json:"error"`
}

// ContractInfo represents deployed contract information
type ContractInfo struct {
	Address    string    `json:"address"`
	Admin      string    `json:"admin"`
	Network    string    `json:"network"`
	DeployedAt time.Time `json:"deployedAt"`
}
