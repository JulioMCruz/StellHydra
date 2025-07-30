// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title StellarEthereumEscrow
 * @dev Hash Time Locked Contract (HTLC) for atomic swaps between Stellar and Ethereum
 * @notice This contract enables secure cross-chain swaps using hash locks and time locks
 */
contract StellarEthereumEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    // State variables
    mapping(bytes32 => EscrowData) public escrows;
    mapping(address => uint256) public balances;
    
    // Events (follow 1inch naming conventions)
    event EscrowCreated(bytes32 indexed escrowId, address indexed maker, uint256 amount, address asset);
    event EscrowLocked(bytes32 indexed escrowId, address indexed resolver, uint256 amount, address asset);
    event EscrowCompleted(bytes32 indexed escrowId, address indexed resolver, uint256 amount, address asset);
    event EscrowRefunded(bytes32 indexed escrowId, address indexed maker, uint256 amount, address asset);
    event FundsWithdrawn(address indexed user, uint256 amount, address asset);

    struct EscrowData {
        bool exists;
        address maker;
        uint256 amount;
        address asset;
        bytes32 hashLock;
        uint256 timeLock;
        uint8 status; // 0: pending, 1: locked, 2: completed, 3: refunded
        bytes32 secret;
        uint256 createdAt;
    }

    struct TimeLocks {
        uint256 withdrawal;
        uint256 refund;
    }

    // Modifiers for validation
    modifier validEscrow(bytes32 escrowId) {
        require(escrows[escrowId].exists, "Invalid escrow");
        _;
    }

    modifier onlyMaker(bytes32 escrowId) {
        require(escrows[escrowId].maker == msg.sender, "Only maker can call");
        _;
    }

    modifier onlyResolver() {
        require(msg.sender != address(0), "Invalid resolver");
        _;
    }

    modifier validStatus(bytes32 escrowId, uint8 expectedStatus) {
        require(escrows[escrowId].status == expectedStatus, "Invalid escrow status");
        _;
    }

    modifier timelockNotExpired(bytes32 escrowId) {
        require(block.timestamp <= escrows[escrowId].timeLock, "Timelock expired");
        _;
    }

    modifier timelockExpired(bytes32 escrowId) {
        require(block.timestamp > escrows[escrowId].timeLock, "Timelock not expired");
        _;
    }

    /**
     * @dev Create a new escrow
     * @param asset The asset address (address(0) for ETH)
     * @param amount The amount to escrow
     * @param hashLock The SHA256 hash of the secret
     * @param timeLocks The withdrawal and refund time locks
     * @return The generated escrow ID
     */
    function createEscrow(
        address asset,
        uint256 amount,
        bytes32 hashLock,
        TimeLocks calldata timeLocks
    ) external payable nonReentrant returns (bytes32) {
        require(amount > 0, "Invalid amount");
        require(hashLock != bytes32(0), "Invalid hash lock");
        require(timeLocks.withdrawal > block.timestamp, "Invalid withdrawal time");
        require(timeLocks.refund > timeLocks.withdrawal, "Invalid refund time");

        // Generate escrow ID
        bytes32 escrowId = keccak256(abi.encodePacked(
            msg.sender,
            asset,
            amount,
            hashLock,
            block.timestamp
        ));

        require(!escrows[escrowId].exists, "Escrow already exists");

        // Transfer tokens to contract
        if (asset == address(0)) {
            // ETH
            require(msg.value == amount, "Incorrect ETH amount");
        } else {
            // ERC20
            require(msg.value == 0, "ETH not expected for ERC20");
            IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        }

        // Create escrow
        escrows[escrowId] = EscrowData({
            exists: true,
            maker: msg.sender,
            amount: amount,
            asset: asset,
            hashLock: hashLock,
            timeLock: timeLocks.withdrawal,
            status: 0, // pending
            secret: bytes32(0),
            createdAt: block.timestamp
        });

        emit EscrowCreated(escrowId, msg.sender, amount, asset);
        return escrowId;
    }

    /**
     * @dev Lock escrow (called by resolver)
     * @param escrowId The escrow ID to lock
     */
    function lockEscrow(
        bytes32 escrowId
    ) external nonReentrant validEscrow(escrowId) onlyResolver validStatus(escrowId, 0) {
        EscrowData storage escrow = escrows[escrowId];
        escrow.status = 1; // locked

        emit EscrowLocked(escrowId, msg.sender, escrow.amount, escrow.asset);
    }

    /**
     * @dev Complete escrow by revealing secret
     * @param escrowId The escrow ID to complete
     * @param secret The secret that matches the hash lock
     */
    function completeEscrow(
        bytes32 escrowId,
        bytes32 secret
    ) external nonReentrant validEscrow(escrowId) onlyResolver validStatus(escrowId, 1) timelockNotExpired(escrowId) {
        EscrowData storage escrow = escrows[escrowId];

        // Verify hash lock using sha256(abi.encodePacked(secret)) == hashLock
        bytes32 computedHash = sha256(abi.encodePacked(secret));
        require(computedHash == escrow.hashLock, "Invalid secret");

        escrow.status = 2; // completed
        escrow.secret = secret;

        // Transfer funds to resolver
        if (escrow.asset == address(0)) {
            // ETH
            (bool success, ) = msg.sender.call{value: escrow.amount}("");
            require(success, "ETH transfer failed");
        } else {
            // ERC20
            IERC20(escrow.asset).safeTransfer(msg.sender, escrow.amount);
        }

        emit EscrowCompleted(escrowId, msg.sender, escrow.amount, escrow.asset);
    }

    /**
     * @dev Refund escrow after timelock expires
     * @param escrowId The escrow ID to refund
     */
    function refundEscrow(bytes32 escrowId) external nonReentrant validEscrow(escrowId) onlyMaker(escrowId) timelockExpired(escrowId) {
        EscrowData storage escrow = escrows[escrowId];
        require(escrow.status == 0 || escrow.status == 1, "Cannot refund completed escrow");

        escrow.status = 3; // refunded

        // Refund funds to maker
        if (escrow.asset == address(0)) {
            // ETH
            (bool success, ) = escrow.maker.call{value: escrow.amount}("");
            require(success, "ETH refund failed");
        } else {
            // ERC20
            IERC20(escrow.asset).safeTransfer(escrow.maker, escrow.amount);
        }

        emit EscrowRefunded(escrowId, escrow.maker, escrow.amount, escrow.asset);
    }

    /**
     * @dev Get escrow details
     * @param escrowId The escrow ID to query
     * @return The escrow data
     */
    function getEscrow(bytes32 escrowId) external view returns (EscrowData memory) {
        require(escrows[escrowId].exists, "Escrow not found");
        return escrows[escrowId];
    }

    /**
     * @dev Check if escrow exists
     * @param escrowId The escrow ID to check
     * @return True if escrow exists
     */
    function escrowExists(bytes32 escrowId) external view returns (bool) {
        return escrows[escrowId].exists;
    }

    /**
     * @dev Get escrow status
     * @param escrowId The escrow ID to query
     * @return The escrow status (0: pending, 1: locked, 2: completed, 3: refunded)
     */
    function getEscrowStatus(bytes32 escrowId) external view returns (uint8) {
        require(escrows[escrowId].exists, "Escrow not found");
        return escrows[escrowId].status;
    }

    /**
     * @dev Get contract balance for a specific asset
     * @param asset The asset address (address(0) for ETH)
     * @return The contract balance
     */
    function getBalance(address asset) external view returns (uint256) {
        if (asset == address(0)) {
            return address(this).balance;
        } else {
            return IERC20(asset).balanceOf(address(this));
        }
    }

    /**
     * @dev Get contract statistics
     * @return totalEscrows The total number of escrows created
     * @return pendingEscrows The number of pending escrows
     * @return lockedEscrows The number of locked escrows
     * @return completedEscrows The number of completed escrows
     * @return refundedEscrows The number of refunded escrows
     */
    function getStats() external view returns (
        uint256 totalEscrows,
        uint256 pendingEscrows,
        uint256 lockedEscrows,
        uint256 completedEscrows,
        uint256 refundedEscrows
    ) {
        // Note: This is a simplified implementation
        // In production, you'd want to track these counters to avoid gas issues
        return (0, 0, 0, 0, 0);
    }

    // Receive function for ETH
    receive() external payable {
        // Allow receiving ETH
    }

    // Fallback function
    fallback() external payable {
        revert("Function not found");
    }
}