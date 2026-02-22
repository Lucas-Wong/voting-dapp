package blockchain

import (
	"context"
	"crypto/ecdsa"
	"fmt"
	"math/big"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/accounts/abi/bind/backends"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"

	"voting-dapp/backend/internal/models"
)

// Client wraps the Ethereum client and contract
type Client struct {
	client       *ethclient.Client
	contract     *Voting
	auth         *bind.TransactOpts
	contractAddr common.Address
}

// NewClient creates a new blockchain client
func NewClient(rpcURL, contractAddr, privateKey string) (*Client, error) {
	// Connect to Ethereum node
	client, err := ethclient.Dial(rpcURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Ethereum node: %v", err)
	}

	// Parse contract address
	contractAddress := common.HexToAddress(contractAddr)

	// Initialize contract binding
	contract, err := NewVoting(contractAddress, client)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize contract: %v", err)
	}

	// Setup transaction options if private key provided
	var auth *bind.TransactOpts
	if privateKey != "" {
		privKey, err := crypto.HexToECDSA(privateKey)
		if err != nil {
			client.Close()
			return nil, fmt.Errorf("invalid private key: %v", err)
		}

		publicKey := privKey.Public()
		publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
		if !ok {
			client.Close()
			return nil, fmt.Errorf("cannot assert type: publicKey is not of type *ecdsa.PublicKey")
		}

		fromAddress := crypto.PubkeyToAddress(*publicKeyECDSA)
		nonce, err := client.PendingNonceAt(context.Background(), fromAddress)
		if err != nil {
			client.Close()
			return nil, fmt.Errorf("failed to get nonce: %v", err)
		}

		gasPrice, err := client.SuggestGasPrice(context.Background())
		if err != nil {
			client.Close()
			return nil, fmt.Errorf("failed to get gas price: %v", err)
		}

		auth, err = bind.NewKeyedTransactorWithChainID(privKey, big.NewInt(1337))
		if err != nil {
			client.Close()
			return nil, fmt.Errorf("failed to create transactor: %v", err)
		}
		auth.Nonce = big.NewInt(int64(nonce))
		auth.Value = big.NewInt(0)
		auth.GasLimit = uint64(3000000)
		auth.GasPrice = gasPrice
	}

	return &Client{
		client:       client,
		contract:     contract,
		auth:         auth,
		contractAddr: contractAddress,
	}, nil
}

// Close closes the client connection
func (c *Client) Close() {
	if c.client != nil {
		c.client.Close()
	}
}

// GetContractAddress returns the contract address
func (c *Client) GetContractAddress() string {
	return c.contractAddr.Hex()
}

// GetAdmin returns the contract admin address
func (c *Client) GetAdmin() (string, error) {
	admin, err := c.contract.Admin(nil)
	if err != nil {
		return "", err
	}
	return admin.Hex(), nil
}

// CreatePoll creates a new voting poll
func (c *Client) CreatePoll(title, description string, options []string, startTime, endTime int64) (uint64, error) {
	if c.auth == nil {
		return 0, fmt.Errorf("no private key configured for transactions")
	}

	tx, err := c.contract.CreatePoll(
		c.auth,
		title,
		description,
		options,
		big.NewInt(startTime),
		big.NewInt(endTime),
	)
	if err != nil {
		return 0, fmt.Errorf("failed to create poll: %v", err)
	}

	// Wait for transaction to be mined
	receipt, err := bind.WaitMined(context.Background(), c.client, tx)
	if err != nil {
		return 0, fmt.Errorf("failed to get receipt: %v", err)
	}

	if receipt.Status == 0 {
		return 0, fmt.Errorf("transaction failed")
	}

	// Get poll count
	pollCount, err := c.contract.PollCount(nil)
	if err != nil {
		return 0, err
	}

	return pollCount.Uint64(), nil
}

// GetPoll retrieves poll details
func (c *Client) GetPoll(pollID uint64) (*models.Poll, error) {
	poll, err := c.contract.GetPoll(nil, big.NewInt(int64(pollID)))
	if err != nil {
		return nil, err
	}

	return &models.Poll{
		ID:          pollID,
		Title:       poll.Title,
		Description: poll.Description,
		Options:     poll.Options,
		StartTime:   poll.StartTime.Int64(),
		EndTime:     poll.EndTime.Int64(),
		Creator:     poll.Creator.Hex(),
		IsActive:    poll.IsActive,
		IsCanceled:  poll.IsCanceled,
		TotalVotes:  poll.TotalVotes.Uint64(),
	}, nil
}

// GetPollResults retrieves poll results
func (c *Client) GetPollResults(pollID uint64) (*models.PollResults, error) {
	results, err := c.contract.GetPollResults(nil, big.NewInt(int64(pollID)))
	if err != nil {
		return nil, err
	}

	voteCounts := make([]uint64, len(results.VoteCountsArray))
	for i, count := range results.VoteCountsArray {
		voteCounts[i] = count.Uint64()
	}

	return &models.PollResults{
		PollID:     pollID,
		Options:    results.OptionNames,
		VoteCounts: voteCounts,
		TotalVotes: results.TotalVotes.Uint64(),
	}, nil
}

// Vote casts a vote
func (c *Client) Vote(pollID, optionIndex uint64) error {
	if c.auth == nil {
		return fmt.Errorf("no private key configured for transactions")
	}

	tx, err := c.contract.Vote(c.auth, big.NewInt(int64(pollID)), big.NewInt(int64(optionIndex)))
	if err != nil {
		return fmt.Errorf("failed to vote: %v", err)
	}

	receipt, err := bind.WaitMined(context.Background(), c.client, tx)
	if err != nil {
		return fmt.Errorf("failed to get receipt: %v", err)
	}

	if receipt.Status == 0 {
		return fmt.Errorf("transaction failed")
	}

	return nil
}

// AssignVotingPower assigns voting power to a voter
func (c *Client) AssignVotingPower(voter string, power uint64) error {
	if c.auth == nil {
		return fmt.Errorf("no private key configured for transactions")
	}

	voterAddr := common.HexToAddress(voter)
	tx, err := c.contract.AssignVotingPower(c.auth, voterAddr, big.NewInt(int64(power)))
	if err != nil {
		return fmt.Errorf("failed to assign voting power: %v", err)
	}

	receipt, err := bind.WaitMined(context.Background(), c.client, tx)
	if err != nil {
		return fmt.Errorf("failed to get receipt: %v", err)
	}

	if receipt.Status == 0 {
		return fmt.Errorf("transaction failed")
	}

	return nil
}

// BatchAssignVotingPower batch assigns voting power
func (c *Client) BatchAssignVotingPower(voters []string, powers []uint64) error {
	if c.auth == nil {
		return fmt.Errorf("no private key configured for transactions")
	}

	voterAddrs := make([]common.Address, len(voters))
	powerBigs := make([]*big.Int, len(powers))

	for i, voter := range voters {
		voterAddrs[i] = common.HexToAddress(voter)
	}
	for i, power := range powers {
		powerBigs[i] = big.NewInt(int64(power))
	}

	tx, err := c.contract.BatchAssignVotingPower(c.auth, voterAddrs, powerBigs)
	if err != nil {
		return fmt.Errorf("failed to batch assign voting power: %v", err)
	}

	receipt, err := bind.WaitMined(context.Background(), c.client, tx)
	if err != nil {
		return fmt.Errorf("failed to get receipt: %v", err)
	}

	if receipt.Status == 0 {
		return fmt.Errorf("transaction failed")
	}

	return nil
}

// GetVotingPower gets voting power for an address
func (c *Client) GetVotingPower(voter string) (uint64, error) {
	voterAddr := common.HexToAddress(voter)
	power, err := c.contract.VotingPower(nil, voterAddr)
	if err != nil {
		return 0, err
	}
	return power.Uint64(), nil
}

// GetVoterStatus gets voter status for a poll
func (c *Client) GetVoterStatus(pollID uint64, voter string) (*models.VoterStatus, error) {
	voterAddr := common.HexToAddress(voter)
	status, err := c.contract.GetVoterStatus(nil, big.NewInt(int64(pollID)), voterAddr)
	if err != nil {
		return nil, err
	}

	votingPower, err := c.GetVotingPower(voter)
	if err != nil {
		return nil, err
	}

	return &models.VoterStatus{
		HasVoted:    status.HasVotedStatus,
		OptionIndex: status.OptionIndex.Uint64(),
		VotingPower: votingPower,
	}, nil
}

// GetPollStatus gets the status of a poll
func (c *Client) GetPollStatus(pollID uint64) (string, error) {
	return c.contract.GetPollStatus(nil, big.NewInt(int64(pollID)))
}

// GetAllPollIds gets all poll IDs
func (c *Client) GetAllPollIds() ([]uint64, error) {
	ids, err := c.contract.GetAllPollIds(nil)
	if err != nil {
		return nil, err
	}

	result := make([]uint64, len(ids))
	for i, id := range ids {
		result[i] = id.Uint64()
	}
	return result, nil
}

// CancelPoll cancels a poll
func (c *Client) CancelPoll(pollID uint64) error {
	if c.auth == nil {
		return fmt.Errorf("no private key configured for transactions")
	}

	tx, err := c.contract.CancelPoll(c.auth, big.NewInt(int64(pollID)))
	if err != nil {
		return fmt.Errorf("failed to cancel poll: %v", err)
	}

	receipt, err := bind.WaitMined(context.Background(), c.client, tx)
	if err != nil {
		return fmt.Errorf("failed to get receipt: %v", err)
	}

	if receipt.Status == 0 {
		return fmt.Errorf("transaction failed")
	}

	return nil
}

// ActivatePoll activates a poll
func (c *Client) ActivatePoll(pollID uint64) error {
	if c.auth == nil {
		return fmt.Errorf("no private key configured for transactions")
	}

	tx, err := c.contract.ActivatePoll(c.auth, big.NewInt(int64(pollID)))
	if err != nil {
		return fmt.Errorf("failed to activate poll: %v", err)
	}

	receipt, err := bind.WaitMined(context.Background(), c.client, tx)
	if err != nil {
		return fmt.Errorf("failed to get receipt: %v", err)
	}

	if receipt.Status == 0 {
		return fmt.Errorf("transaction failed")
	}

	return nil
}

// DeactivatePoll deactivates a poll
func (c *Client) DeactivatePoll(pollID uint64) error {
	if c.auth == nil {
		return fmt.Errorf("no private key configured for transactions")
	}

	tx, err := c.contract.DeactivatePoll(c.auth, big.NewInt(int64(pollID)))
	if err != nil {
		return fmt.Errorf("failed to deactivate poll: %v", err)
	}

	receipt, err := bind.WaitMined(context.Background(), c.client, tx)
	if err != nil {
		return fmt.Errorf("failed to get receipt: %v", err)
	}

	if receipt.Status == 0 {
		return fmt.Errorf("transaction failed")
	}

	return nil
}

// NewSimulatedClient creates a simulated blockchain client for testing
func NewSimulatedClient() (*Client, error) {
	privateKey, err := crypto.GenerateKey()
	if err != nil {
		return nil, err
	}

	auth, err := bind.NewKeyedTransactorWithChainID(privateKey, big.NewInt(1337))
	if err != nil {
		return nil, err
	}

	address := crypto.PubkeyToAddress(privateKey.PublicKey)
	alloc := make(core.GenesisAlloc)
	alloc[address] = core.GenesisAccount{Balance: big.NewInt(1000000000000000000)}

	backend := backends.NewSimulatedBackend(alloc, 10000000)
	backend.Commit()

	// Deploy contract
	_, _, contract, err := DeployVoting(auth, backend)
	if err != nil {
		return nil, fmt.Errorf("failed to deploy contract: %v", err)
	}
	backend.Commit()

	return &Client{
		client:       nil,
		contract:     contract,
		auth:         auth,
		contractAddr: address,
	}, nil
}
