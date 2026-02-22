const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting", function () {
  let voting;
  let owner;
  let addr1;
  let addr2;
  let addr3;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    
    const Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy();
    await voting.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right admin", async function () {
      expect(await voting.admin()).to.equal(owner.address);
    });

    it("Should initialize with zero polls", async function () {
      expect(await voting.pollCount()).to.equal(0);
    });
  });

  describe("Voting Power Management", function () {
    it("Should assign voting power to a voter", async function () {
      await voting.assignVotingPower(addr1.address, 100);
      expect(await voting.votingPower(addr1.address)).to.equal(100);
    });

    it("Should batch assign voting power", async function () {
      await voting.batchAssignVotingPower(
        [addr1.address, addr2.address],
        [100, 200]
      );
      expect(await voting.votingPower(addr1.address)).to.equal(100);
      expect(await voting.votingPower(addr2.address)).to.equal(200);
    });

    it("Should not allow non-admin to assign voting power", async function () {
      await expect(
        voting.connect(addr1).assignVotingPower(addr2.address, 100)
      ).to.be.revertedWith("Only admin can call this function");
    });
  });

  describe("Poll Creation", function () {
    it("Should create a poll successfully", async function () {
      const startTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const endTime = startTime + 86400; // 24 hours duration

      await expect(
        voting.createPoll(
          "Test Poll",
          "This is a test poll",
          ["Option A", "Option B", "Option C"],
          startTime,
          endTime
        )
      ).to.emit(voting, "PollCreated");

      expect(await voting.pollCount()).to.equal(1);
      
      const poll = await voting.getPoll(1);
      expect(poll.title).to.equal("Test Poll");
      expect(poll.options.length).to.equal(3);
    });

    it("Should not create poll with less than 2 options", async function () {
      const startTime = Math.floor(Date.now() / 1000) + 3600;
      const endTime = startTime + 86400;

      await expect(
        voting.createPoll(
          "Test Poll",
          "Description",
          ["Only One Option"],
          startTime,
          endTime
        )
      ).to.be.revertedWith("At least 2 options required");
    });

    it("Should not create poll with invalid time range", async function () {
      const startTime = Math.floor(Date.now() / 1000) + 86400;
      const endTime = startTime - 3600; // End before start

      await expect(
        voting.createPoll(
          "Test Poll",
          "Description",
          ["Option A", "Option B"],
          startTime,
          endTime
        )
      ).to.be.revertedWith("Invalid time range");
    });
  });

  describe("Voting", function () {
    let startTime;
    let endTime;

    beforeEach(async function () {
      // Assign voting power
      await voting.assignVotingPower(addr1.address, 100);
      await voting.assignVotingPower(addr2.address, 50);

      // Create a poll that starts immediately
      const currentTime = Math.floor(Date.now() / 1000);
      startTime = currentTime - 60; // Started 1 minute ago
      endTime = currentTime + 86400; // Ends in 24 hours

      await voting.createPoll(
        "Test Poll",
        "Description",
        ["Option A", "Option B"],
        startTime,
        endTime
      );
    });

    it("Should allow voting", async function () {
      await expect(voting.connect(addr1).vote(1, 0))
        .to.emit(voting, "Voted")
        .withArgs(1, addr1.address, 0, 100);

      expect(await voting.hasVoted(1, addr1.address)).to.be.true;
      
      const results = await voting.getPollResults(1);
      expect(results.voteCountsArray[0]).to.equal(100);
    });

    it("Should not allow double voting", async function () {
      await voting.connect(addr1).vote(1, 0);
      
      await expect(
        voting.connect(addr1).vote(1, 1)
      ).to.be.revertedWith("Already voted");
    });

    it("Should not allow voting without voting power", async function () {
      await expect(
        voting.connect(addr3).vote(1, 0)
      ).to.be.revertedWith("No voting power");
    });

    it("Should not allow voting with invalid option", async function () {
      await expect(
        voting.connect(addr1).vote(1, 5)
      ).to.be.revertedWith("Invalid option index");
    });
  });

  describe("Poll Management", function () {
    it("Should cancel a poll", async function () {
      const startTime = Math.floor(Date.now() / 1000) + 3600;
      const endTime = startTime + 86400;

      await voting.createPoll(
        "Test Poll",
        "Description",
        ["Option A", "Option B"],
        startTime,
        endTime
      );

      await expect(voting.cancelPoll(1))
        .to.emit(voting, "PollCanceled");
      
      const poll = await voting.getPoll(1);
      expect(poll.isCanceled).to.be.true;
    });

    it("Should get poll status correctly", async function () {
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Create pending poll
      await voting.createPoll(
        "Pending Poll",
        "Description",
        ["A", "B"],
        currentTime + 3600,
        currentTime + 7200
      );

      const status = await voting.getPollStatus(1);
      expect(status).to.equal("Pending");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await voting.assignVotingPower(addr1.address, 100);
      
      const currentTime = Math.floor(Date.now() / 1000);
      await voting.createPoll(
        "Poll 1",
        "Description 1",
        ["A", "B"],
        currentTime - 60,
        currentTime + 86400
      );
    });

    it("Should return all poll IDs", async function () {
      const pollIds = await voting.getAllPollIds();
      expect(pollIds.length).to.equal(1);
      expect(pollIds[0]).to.equal(1);
    });

    it("Should return polls by creator", async function () {
      const pollIds = await voting.getPollsByCreator(owner.address);
      expect(pollIds.length).to.equal(1);
    });

    it("Should return voter status", async function () {
      await voting.connect(addr1).vote(1, 0);
      
      const [hasVoted, optionIndex] = await voting.getVoterStatus(1, addr1.address);
      expect(hasVoted).to.be.true;
      expect(optionIndex).to.equal(0);
    });
  });
});
