const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("StellarEthereumEscrow", function () {
  let StellarEthereumEscrow;
  let escrowContract;
  let owner, resolver, maker, other;
  let secret, hashLock;
  let timeLocks;

  beforeEach(async function () {
    // Get signers
    [owner, resolver, maker, other] = await ethers.getSigners();

    // Deploy contract
    StellarEthereumEscrow = await ethers.getContractFactory("StellarEthereumEscrow");
    escrowContract = await StellarEthereumEscrow.deploy();
    await escrowContract.waitForDeployment();

    // Generate test secret and hash
    secret = ethers.randomBytes(32);
    hashLock = ethers.sha256(ethers.solidityPacked(["bytes32"], [secret]));

    // Set time locks
    const now = await time.latest();
    timeLocks = {
      withdrawal: now + 3600, // 1 hour
      refund: now + 7200      // 2 hours
    };
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await escrowContract.getAddress()).to.be.properAddress;
    });

    it("Should have zero balance initially", async function () {
      expect(await escrowContract.getBalance(ethers.ZeroAddress)).to.equal(0);
    });
  });

  describe("ETH Escrow Creation", function () {
    it("Should create ETH escrow successfully", async function () {
      const amount = ethers.parseEther("1.0");

      const tx = await escrowContract.connect(maker).createEscrow(
        ethers.ZeroAddress, // ETH
        amount,
        hashLock,
        timeLocks,
        { value: amount }
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return escrowContract.interface.parseLog(log).name === 'EscrowCreated';
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;
      
      const parsedEvent = escrowContract.interface.parseLog(event);
      const escrowId = parsedEvent.args.escrowId;

      // Verify escrow data
      const escrow = await escrowContract.getEscrow(escrowId);
      expect(escrow.maker).to.equal(maker.address);
      expect(escrow.amount).to.equal(amount);
      expect(escrow.asset).to.equal(ethers.ZeroAddress);
      expect(escrow.hashLock).to.equal(hashLock);
      expect(escrow.status).to.equal(0); // pending
      expect(escrow.exists).to.be.true;
    });

    it("Should fail with insufficient ETH", async function () {
      const amount = ethers.parseEther("1.0");
      const sentAmount = ethers.parseEther("0.5");

      await expect(
        escrowContract.connect(maker).createEscrow(
          ethers.ZeroAddress,
          amount,
          hashLock,
          timeLocks,
          { value: sentAmount }
        )
      ).to.be.revertedWith("Incorrect ETH amount");
    });

    it("Should fail with zero amount", async function () {
      await expect(
        escrowContract.connect(maker).createEscrow(
          ethers.ZeroAddress,
          0,
          hashLock,
          timeLocks,
          { value: 0 }
        )
      ).to.be.revertedWith("Invalid amount");
    });

    it("Should fail with invalid hash lock", async function () {
      const amount = ethers.parseEther("1.0");

      await expect(
        escrowContract.connect(maker).createEscrow(
          ethers.ZeroAddress,
          amount,
          ethers.ZeroHash,
          timeLocks,
          { value: amount }
        )
      ).to.be.revertedWith("Invalid hash lock");
    });

    it("Should fail with invalid withdrawal time", async function () {
      const amount = ethers.parseEther("1.0");
      const invalidTimeLocks = {
        withdrawal: await time.latest() - 3600, // Past time
        refund: (await time.latest()) + 7200
      };

      await expect(
        escrowContract.connect(maker).createEscrow(
          ethers.ZeroAddress,
          amount,
          hashLock,
          invalidTimeLocks,
          { value: amount }
        )
      ).to.be.revertedWith("Invalid withdrawal time");
    });
  });

  describe("Escrow Locking", function () {
    let escrowId;

    beforeEach(async function () {
      const amount = ethers.parseEther("1.0");
      const tx = await escrowContract.connect(maker).createEscrow(
        ethers.ZeroAddress,
        amount,
        hashLock,
        timeLocks,
        { value: amount }
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return escrowContract.interface.parseLog(log).name === 'EscrowCreated';
        } catch {
          return false;
        }
      });

      escrowId = escrowContract.interface.parseLog(event).args.escrowId;
    });

    it("Should lock escrow successfully", async function () {
      await expect(escrowContract.connect(resolver).lockEscrow(escrowId))
        .to.emit(escrowContract, "EscrowLocked")
        .withArgs(escrowId, resolver.address, ethers.parseEther("1.0"), ethers.ZeroAddress);

      const escrow = await escrowContract.getEscrow(escrowId);
      expect(escrow.status).to.equal(1); // locked
    });

    it("Should fail to lock already locked escrow", async function () {
      await escrowContract.connect(resolver).lockEscrow(escrowId);

      await expect(
        escrowContract.connect(resolver).lockEscrow(escrowId)
      ).to.be.revertedWith("Invalid escrow status");
    });

    it("Should fail with invalid escrow ID", async function () {
      const invalidEscrowId = ethers.randomBytes(32);

      await expect(
        escrowContract.connect(resolver).lockEscrow(invalidEscrowId)
      ).to.be.revertedWith("Invalid escrow");
    });
  });

  describe("Escrow Completion", function () {
    let escrowId;

    beforeEach(async function () {
      const amount = ethers.parseEther("1.0");
      const tx = await escrowContract.connect(maker).createEscrow(
        ethers.ZeroAddress,
        amount,
        hashLock,
        timeLocks,
        { value: amount }
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return escrowContract.interface.parseLog(log).name === 'EscrowCreated';
        } catch {
          return false;
        }
      });

      escrowId = escrowContract.interface.parseLog(event).args.escrowId;
      
      // Lock the escrow
      await escrowContract.connect(resolver).lockEscrow(escrowId);
    });

    it("Should complete escrow with correct secret", async function () {
      const initialBalance = await ethers.provider.getBalance(resolver.address);

      const tx = await escrowContract.connect(resolver).completeEscrow(escrowId, secret);
      const receipt = await tx.wait();

      // Check event
      expect(tx).to.emit(escrowContract, "EscrowCompleted")
        .withArgs(escrowId, resolver.address, ethers.parseEther("1.0"), ethers.ZeroAddress);

      // Check escrow status
      const escrow = await escrowContract.getEscrow(escrowId);
      expect(escrow.status).to.equal(2); // completed
      expect(escrow.secret).to.equal(secret);

      // Check resolver received funds (account for gas costs)
      const finalBalance = await ethers.provider.getBalance(resolver.address);
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      expect(finalBalance).to.be.closeTo(
        initialBalance + ethers.parseEther("1.0") - gasUsed,
        ethers.parseEther("0.01") // Allow for some variance in gas calculations
      );
    });

    it("Should fail with incorrect secret", async function () {
      const wrongSecret = ethers.randomBytes(32);

      await expect(
        escrowContract.connect(resolver).completeEscrow(escrowId, wrongSecret)
      ).to.be.revertedWith("Invalid secret");
    });

    it("Should fail if timelock expired", async function () {
      // Fast forward time past withdrawal timelock
      await time.increaseTo(timeLocks.withdrawal + 1);

      await expect(
        escrowContract.connect(resolver).completeEscrow(escrowId, secret)
      ).to.be.revertedWith("Timelock expired");
    });

    it("Should fail if not called by resolver", async function () {
      await expect(
        escrowContract.connect(maker).completeEscrow(escrowId, secret)
      ).to.be.revertedWith("Invalid resolver");
    });
  });

  describe("Escrow Refund", function () {
    let escrowId;

    beforeEach(async function () {
      const amount = ethers.parseEther("1.0");
      const tx = await escrowContract.connect(maker).createEscrow(
        ethers.ZeroAddress,
        amount,
        hashLock,
        timeLocks,
        { value: amount }
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return escrowContract.interface.parseLog(log).name === 'EscrowCreated';
        } catch {
          return false;
        }
      });

      escrowId = escrowContract.interface.parseLog(event).args.escrowId;
    });

    it("Should refund escrow after timelock expires", async function () {
      const initialBalance = await ethers.provider.getBalance(maker.address);

      // Fast forward time past refund timelock
      await time.increaseTo(timeLocks.refund + 1);

      const tx = await escrowContract.connect(maker).refundEscrow(escrowId);
      const receipt = await tx.wait();

      // Check event
      expect(tx).to.emit(escrowContract, "EscrowRefunded")
        .withArgs(escrowId, maker.address, ethers.parseEther("1.0"), ethers.ZeroAddress);

      // Check escrow status
      const escrow = await escrowContract.getEscrow(escrowId);
      expect(escrow.status).to.equal(3); // refunded

      // Check maker received refund (account for gas costs)
      const finalBalance = await ethers.provider.getBalance(maker.address);
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      expect(finalBalance).to.be.closeTo(
        initialBalance + ethers.parseEther("1.0") - gasUsed,
        ethers.parseEther("0.01")
      );
    });

    it("Should fail if timelock not expired", async function () {
      await expect(
        escrowContract.connect(maker).refundEscrow(escrowId)
      ).to.be.revertedWith("Timelock not expired");
    });

    it("Should fail if not called by maker", async function () {
      // Fast forward time past refund timelock
      await time.increaseTo(timeLocks.refund + 1);

      await expect(
        escrowContract.connect(other).refundEscrow(escrowId)
      ).to.be.revertedWith("Only maker can call");
    });

    it("Should fail to refund completed escrow", async function () {
      // Lock and complete escrow first
      await escrowContract.connect(resolver).lockEscrow(escrowId);
      await escrowContract.connect(resolver).completeEscrow(escrowId, secret);

      // Fast forward time past refund timelock
      await time.increaseTo(timeLocks.refund + 1);

      await expect(
        escrowContract.connect(maker).refundEscrow(escrowId)
      ).to.be.revertedWith("Cannot refund completed escrow");
    });
  });

  describe("View Functions", function () {
    let escrowId;

    beforeEach(async function () {
      const amount = ethers.parseEther("1.0");
      const tx = await escrowContract.connect(maker).createEscrow(
        ethers.ZeroAddress,
        amount,
        hashLock,
        timeLocks,
        { value: amount }
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return escrowContract.interface.parseLog(log).name === 'EscrowCreated';
        } catch {
          return false;
        }
      });

      escrowId = escrowContract.interface.parseLog(event).args.escrowId;
    });

    it("Should check if escrow exists", async function () {
      expect(await escrowContract.escrowExists(escrowId)).to.be.true;
      
      const nonExistentId = ethers.randomBytes(32);
      expect(await escrowContract.escrowExists(nonExistentId)).to.be.false;
    });

    it("Should get escrow status", async function () {
      expect(await escrowContract.getEscrowStatus(escrowId)).to.equal(0); // pending

      await escrowContract.connect(resolver).lockEscrow(escrowId);
      expect(await escrowContract.getEscrowStatus(escrowId)).to.equal(1); // locked
    });

    it("Should get contract balance", async function () {
      expect(await escrowContract.getBalance(ethers.ZeroAddress)).to.equal(ethers.parseEther("1.0"));
    });

    it("Should fail to get non-existent escrow", async function () {
      const nonExistentId = ethers.randomBytes(32);
      
      await expect(
        escrowContract.getEscrow(nonExistentId)
      ).to.be.revertedWith("Escrow not found");
    });
  });

  describe("Complete Atomic Swap Flow", function () {
    it("Should execute full atomic swap successfully", async function () {
      const amount = ethers.parseEther("1.0");
      
      // Step 1: Maker creates escrow
      const createTx = await escrowContract.connect(maker).createEscrow(
        ethers.ZeroAddress,
        amount,
        hashLock,
        timeLocks,
        { value: amount }
      );

      const createReceipt = await createTx.wait();
      const createEvent = createReceipt.logs.find(log => {
        try {
          return escrowContract.interface.parseLog(log).name === 'EscrowCreated';
        } catch {
          return false;
        }
      });

      const escrowId = escrowContract.interface.parseLog(createEvent).args.escrowId;

      // Verify escrow is created and pending
      let escrow = await escrowContract.getEscrow(escrowId);
      expect(escrow.status).to.equal(0); // pending
      expect(escrow.amount).to.equal(amount);

      // Step 2: Resolver locks escrow
      await escrowContract.connect(resolver).lockEscrow(escrowId);
      
      escrow = await escrowContract.getEscrow(escrowId);
      expect(escrow.status).to.equal(1); // locked

      // Step 3: Resolver completes escrow with secret
      const resolverInitialBalance = await ethers.provider.getBalance(resolver.address);
      
      const completeTx = await escrowContract.connect(resolver).completeEscrow(escrowId, secret);
      const completeReceipt = await completeTx.wait();

      // Verify escrow is completed
      escrow = await escrowContract.getEscrow(escrowId);
      expect(escrow.status).to.equal(2); // completed
      expect(escrow.secret).to.equal(secret);

      // Verify resolver received the funds
      const resolverFinalBalance = await ethers.provider.getBalance(resolver.address);
      const gasUsed = completeReceipt.gasUsed * completeReceipt.gasPrice;
      
      expect(resolverFinalBalance).to.be.closeTo(
        resolverInitialBalance + amount - gasUsed,
        ethers.parseEther("0.01")
      );
    });
  });

  describe("Edge Cases", function () {
    it("Should handle receiving ETH via receive function", async function () {
      const amount = ethers.parseEther("1.0");
      
      await owner.sendTransaction({
        to: await escrowContract.getAddress(),
        value: amount
      });

      expect(await escrowContract.getBalance(ethers.ZeroAddress)).to.equal(amount);
    });

    it("Should revert on fallback function call", async function () {
      const contractAddress = await escrowContract.getAddress();
      
      await expect(
        owner.sendTransaction({
          to: contractAddress,
          data: "0x12345678" // Invalid function selector
        })
      ).to.be.revertedWith("Function not found");
    });
  });
});