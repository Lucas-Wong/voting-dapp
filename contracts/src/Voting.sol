// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Voting
 * @dev A decentralized voting system with customizable polls
 * @author Web3 Voting DApp
 */
contract Voting {
    // ============ Structs ============
    
    struct Poll {
        uint256 id;
        string title;
        string description;
        string[] options;
        uint256 startTime;
        uint256 endTime;
        address creator;
        bool isActive;
        bool isCanceled;
        uint256 totalVotes;
    }
    
    struct Vote {
        uint256 pollId;
        uint256 optionIndex;
        address voter;
        uint256 timestamp;
    }
    
    // ============ State Variables ============
    
    address public admin;
    uint256 public pollCount;
    
    // pollId => Poll
    mapping(uint256 => Poll) public polls;
    
    // pollId => optionIndex => voteCount
    mapping(uint256 => mapping(uint256 => uint256)) public voteCounts;
    
    // pollId => voter => hasVoted
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    
    // pollId => voter => Vote
    mapping(uint256 => mapping(address => Vote)) public votes;
    
    // voter => votingPower
    mapping(address => uint256) public votingPower;
    
    // ============ Events ============
    
    event PollCreated(
        uint256 indexed pollId,
        string title,
        address indexed creator,
        uint256 startTime,
        uint256 endTime
    );
    
    event Voted(
        uint256 indexed pollId,
        address indexed voter,
        uint256 optionIndex,
        uint256 weight
    );
    
    event VotingPowerAssigned(
        address indexed voter,
        uint256 power
    );
    
    event PollCanceled(uint256 indexed pollId);
    
    event PollActivated(uint256 indexed pollId);
    
    event PollDeactivated(uint256 indexed pollId);
    
    // ============ Modifiers ============
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }
    
    modifier pollExists(uint256 _pollId) {
        require(_pollId > 0 && _pollId <= pollCount, "Poll does not exist");
        _;
    }
    
    modifier pollActive(uint256 _pollId) {
        require(polls[_pollId].isActive, "Poll is not active");
        require(!polls[_pollId].isCanceled, "Poll has been canceled");
        _;
    }
    
    modifier withinTimeFrame(uint256 _pollId) {
        require(block.timestamp >= polls[_pollId].startTime, "Poll has not started yet");
        require(block.timestamp <= polls[_pollId].endTime, "Poll has ended");
        _;
    }
    
    // ============ Constructor ============
    
    constructor() {
        admin = msg.sender;
        pollCount = 0;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @dev Transfer admin rights to a new address
     * @param _newAdmin The new admin address
     */
    function transferAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "Invalid admin address");
        admin = _newAdmin;
    }
    
    /**
     * @dev Assign voting power to a voter
     * @param _voter The voter address
     * @param _power The voting power amount
     */
    function assignVotingPower(address _voter, uint256 _power) external onlyAdmin {
        require(_voter != address(0), "Invalid voter address");
        votingPower[_voter] = _power;
        emit VotingPowerAssigned(_voter, _power);
    }
    
    /**
     * @dev Batch assign voting power to multiple voters
     * @param _voters Array of voter addresses
     * @param _powers Array of voting power amounts
     */
    function batchAssignVotingPower(
        address[] calldata _voters,
        uint256[] calldata _powers
    ) external onlyAdmin {
        require(_voters.length == _powers.length, "Arrays length mismatch");
        for (uint256 i = 0; i < _voters.length; i++) {
            require(_voters[i] != address(0), "Invalid voter address");
            votingPower[_voters[i]] = _powers[i];
            emit VotingPowerAssigned(_voters[i], _powers[i]);
        }
    }
    
    /**
     * @dev Cancel a poll
     * @param _pollId The poll ID
     */
    function cancelPoll(uint256 _pollId) external onlyAdmin pollExists(_pollId) {
        polls[_pollId].isCanceled = true;
        emit PollCanceled(_pollId);
    }
    
    /**
     * @dev Activate a poll
     * @param _pollId The poll ID
     */
    function activatePoll(uint256 _pollId) external onlyAdmin pollExists(_pollId) {
        polls[_pollId].isActive = true;
        emit PollActivated(_pollId);
    }
    
    /**
     * @dev Deactivate a poll
     * @param _pollId The poll ID
     */
    function deactivatePoll(uint256 _pollId) external onlyAdmin pollExists(_pollId) {
        polls[_pollId].isActive = false;
        emit PollDeactivated(_pollId);
    }
    
    // ============ Poll Functions ============
    
    /**
     * @dev Create a new poll
     * @param _title Poll title
     * @param _description Poll description
     * @param _options Array of voting options
     * @param _startTime Start timestamp
     * @param _endTime End timestamp
     * @return pollId The created poll ID
     */
    function createPoll(
        string calldata _title,
        string calldata _description,
        string[] calldata _options,
        uint256 _startTime,
        uint256 _endTime
    ) external returns (uint256) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(_options.length >= 2, "At least 2 options required");
        require(_startTime < _endTime, "Invalid time range");
        require(_startTime >= block.timestamp, "Start time must be in the future");
        
        pollCount++;
        
        polls[pollCount] = Poll({
            id: pollCount,
            title: _title,
            description: _description,
            options: _options,
            startTime: _startTime,
            endTime: _endTime,
            creator: msg.sender,
            isActive: true,
            isCanceled: false,
            totalVotes: 0
        });
        
        emit PollCreated(pollCount, _title, msg.sender, _startTime, _endTime);
        
        return pollCount;
    }
    
    /**
     * @dev Cast a vote
     * @param _pollId The poll ID
     * @param _optionIndex The selected option index
     */
    function vote(uint256 _pollId, uint256 _optionIndex) 
        external 
        pollExists(_pollId) 
        pollActive(_pollId) 
        withinTimeFrame(_pollId) 
    {
        require(!hasVoted[_pollId][msg.sender], "Already voted");
        require(_optionIndex < polls[_pollId].options.length, "Invalid option index");
        require(votingPower[msg.sender] > 0, "No voting power");
        
        uint256 weight = votingPower[msg.sender];
        
        hasVoted[_pollId][msg.sender] = true;
        voteCounts[_pollId][_optionIndex] += weight;
        polls[_pollId].totalVotes += weight;
        
        votes[_pollId][msg.sender] = Vote({
            pollId: _pollId,
            optionIndex: _optionIndex,
            voter: msg.sender,
            timestamp: block.timestamp
        });
        
        emit Voted(_pollId, msg.sender, _optionIndex, weight);
    }
    
    // ============ View Functions ============
    
    /**
     * @dev Get poll details
     * @param _pollId The poll ID
     * @return title Poll title
     * @return description Poll description
     * @return options Poll options
     * @return startTime Start timestamp
     * @return endTime End timestamp
     * @return creator Poll creator
     * @return isActive Active status
     * @return isCanceled Canceled status
     * @return totalVotes Total votes cast
     */
    function getPoll(uint256 _pollId) 
        external 
        view 
        pollExists(_pollId) 
        returns (
            string memory title,
            string memory description,
            string[] memory options,
            uint256 startTime,
            uint256 endTime,
            address creator,
            bool isActive,
            bool isCanceled,
            uint256 totalVotes
        ) 
    {
        Poll storage poll = polls[_pollId];
        return (
            poll.title,
            poll.description,
            poll.options,
            poll.startTime,
            poll.endTime,
            poll.creator,
            poll.isActive,
            poll.isCanceled,
            poll.totalVotes
        );
    }
    
    /**
     * @dev Get poll results
     * @param _pollId The poll ID
     * @return optionNames Array of option names
     * @return voteCountsArray Array of vote counts per option
     * @return totalVotes Total votes cast
     */
    function getPollResults(uint256 _pollId) 
        external 
        view 
        pollExists(_pollId) 
        returns (
            string[] memory optionNames,
            uint256[] memory voteCountsArray,
            uint256 totalVotes
        ) 
    {
        Poll storage poll = polls[_pollId];
        uint256 optionCount = poll.options.length;
        
        optionNames = new string[](optionCount);
        voteCountsArray = new uint256[](optionCount);
        
        for (uint256 i = 0; i < optionCount; i++) {
            optionNames[i] = poll.options[i];
            voteCountsArray[i] = voteCounts[_pollId][i];
        }
        
        return (optionNames, voteCountsArray, poll.totalVotes);
    }
    
    /**
     * @dev Check if a user has voted in a poll
     * @param _pollId The poll ID
     * @param _voter The voter address
     * @return hasVotedStatus Whether the user has voted
     * @return optionIndex The selected option index (if voted)
     */
    function getVoterStatus(uint256 _pollId, address _voter) 
        external 
        view 
        pollExists(_pollId) 
        returns (bool hasVotedStatus, uint256 optionIndex) 
    {
        hasVotedStatus = hasVoted[_pollId][_voter];
        if (hasVotedStatus) {
            optionIndex = votes[_pollId][_voter].optionIndex;
        }
    }
    
    /**
     * @dev Get vote details from a voter
     * @param _pollId The poll ID
     * @param _voter The voter address
     * @return vote The vote details
     */
    function getVote(uint256 _pollId, address _voter) 
        external 
        view 
        pollExists(_pollId) 
        returns (Vote memory) 
    {
        require(hasVoted[_pollId][_voter], "Voter has not voted");
        return votes[_pollId][_voter];
    }
    
    /**
     * @dev Get poll status
     * @param _pollId The poll ID
     * @return status Status string
     */
    function getPollStatus(uint256 _pollId) 
        external 
        view 
        pollExists(_pollId) 
        returns (string memory status) 
    {
        Poll storage poll = polls[_pollId];
        
        if (poll.isCanceled) {
            return "Canceled";
        }
        
        if (block.timestamp < poll.startTime) {
            return "Pending";
        }
        
        if (block.timestamp > poll.endTime) {
            return "Ended";
        }
        
        if (poll.isActive) {
            return "Active";
        }
        
        return "Inactive";
    }
    
    /**
     * @dev Get all poll IDs
     * @return pollIds Array of poll IDs
     */
    function getAllPollIds() external view returns (uint256[] memory) {
        uint256[] memory pollIds = new uint256[](pollCount);
        for (uint256 i = 1; i <= pollCount; i++) {
            pollIds[i - 1] = i;
        }
        return pollIds;
    }
    
    /**
     * @dev Get polls by creator
     * @param _creator The creator address
     * @return pollIds Array of poll IDs created by the address
     */
    function getPollsByCreator(address _creator) external view returns (uint256[] memory) {
        uint256 count = 0;
        
        // First count how many polls
        for (uint256 i = 1; i <= pollCount; i++) {
            if (polls[i].creator == _creator) {
                count++;
            }
        }
        
        // Create array and populate
        uint256[] memory creatorPolls = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= pollCount; i++) {
            if (polls[i].creator == _creator) {
                creatorPolls[index] = i;
                index++;
            }
        }
        
        return creatorPolls;
    }
}
