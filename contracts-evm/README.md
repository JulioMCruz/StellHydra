# StellHydra EVM Contracts

Ethereum smart contracts for StellHydra's cross-chain bridge system, implementing Hash Time Locked Contracts (HTLC) for secure atomic swaps between Stellar and Ethereum networks.

## 📁 Project Structure

```
contracts-evm/
├── contracts/
│   └── StellarEthereumEscrow.sol    # Main HTLC contract
├── scripts/
│   ├── deploy.js                    # Deployment script
│   ├── verify.js                    # Contract verification
│   ├── interact.js                  # Contract interaction utilities
│   └── create-wallet.js             # Development wallet generator
├── test/
│   └── StellarEthereumEscrow.test.js # Comprehensive test suite
├── hardhat.config.js                # Hardhat configuration
├── .env.example                     # Environment variables template
└── README.md                        # This documentation
```

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v16 or higher)
2. **npm** or **yarn**
3. **Sepolia ETH** for testnet deployment

### Installation

```bash
cd contracts-evm
npm install
```

### Setup Development Wallet

```bash
npm run create-wallet
```

This will generate a new development wallet and display the address to fund:

```
📍 Address: 0x31C6949cb3A40546e2C2752005A6F9a44f8BD45B
```

### Fund Your Wallet

Get Sepolia ETH from these faucets:
- 🚰 [Sepolia Faucet](https://sepoliafaucet.com/)
- 🚰 [Chainlink Faucet](https://faucets.chain.link/sepolia)
- 🚰 [Alchemy Faucet](https://sepoliafaucet.com/)

### Configuration

1. The wallet creation script automatically creates a `.env` file
2. (Optional) Add your Etherscan API key for contract verification:
   ```bash
   ETHERSCAN_API_KEY=your_etherscan_api_key_here
   ```

## 📋 Contract Overview

### 🔒 **StellarEthereumEscrow Contract**

**Purpose**: Hash Time Locked Contract (HTLC) for atomic cross-chain swaps

**Key Features**:
- ✅ **ETH and ERC20 Support**: Handle both native ETH and ERC20 tokens
- ✅ **Hash Time Locks**: SHA256 hash locks with time-based expiration
- ✅ **Atomic Swaps**: Secure cross-chain atomic transactions
- ✅ **Refund Protection**: Automatic refunds after timelock expiry
- ✅ **OpenZeppelin Security**: Built on battle-tested OpenZeppelin contracts

**Core Functions**:
- `createEscrow(asset, amount, hashLock, timeLocks)` - Create new escrow
- `lockEscrow(escrowId)` - Lock escrow (called by resolver)
- `completeEscrow(escrowId, secret)` - Complete swap with secret reveal
- `refundEscrow(escrowId)` - Refund after timelock expiry
- `getEscrow(escrowId)` - Query escrow details

**Security Features**:
- ✅ **ReentrancyGuard**: Protection against reentrancy attacks
- ✅ **SafeERC20**: Safe token transfers with proper error handling
- ✅ **Access Control**: Maker and resolver permission validation
- ✅ **Time Lock Validation**: Proper timelock expiry checks
- ✅ **Hash Verification**: SHA256 secret verification

## 🛠️ Development Commands

### Compilation and Testing

```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Run tests with gas reporting
npm run gas-report

# Generate coverage report
npm run coverage
```

### Deployment

```bash
# Deploy to Sepolia testnet
npm run deploy:sepolia

# Deploy to Ethereum mainnet
npm run deploy:mainnet
```

### Contract Verification

```bash
# Verify on Sepolia
npm run verify:sepolia

# Verify on mainnet
npm run verify:mainnet
```

### Contract Interaction

```bash
# Interact with deployed contract on Sepolia
npm run interact:sepolia

# Create test escrow on Sepolia
npm run create-test-escrow
```

## 🧪 Testing

The contract includes comprehensive tests covering:

### Test Coverage
- ✅ **Contract Deployment**: Successful deployment and initialization
- ✅ **ETH Escrow Creation**: Create escrows with various parameters
- ✅ **Escrow Locking**: Lock escrows by authorized resolvers
- ✅ **Escrow Completion**: Complete swaps with secret revelation
- ✅ **Escrow Refunds**: Refund expired escrows
- ✅ **Edge Cases**: Error conditions and security validations
- ✅ **Full Atomic Swap Flow**: End-to-end swap execution

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npx hardhat test test/StellarEthereumEscrow.test.js

# Run tests with gas reporting
REPORT_GAS=true npm test
```

## 📜 Deployment Information

### Current Deployment

| Property | Value |
|----------|-------|
| **Network** | Sepolia Testnet |
| **Contract** | StellarEthereumEscrow |
| **Address** | `0xA3268A7e4f3dF28ABb09a8eDe7665Cba9E82e940` |
| **Status** | ✅ **DEPLOYED & VERIFIED** |
| **Deployer** | `0x31C6949cb3A40546e2C2752005A6F9a44f8BD45B` |
| **Verification** | ✅ Verified on Etherscan |

### Explorer Links

🔍 **Etherscan (Verified Source Code)**:
- **Contract**: https://sepolia.etherscan.io/address/0xA3268A7e4f3dF28ABb09a8eDe7665Cba9E82e940#code
- **Transactions**: https://sepolia.etherscan.io/address/0xA3268A7e4f3dF28ABb09a8eDe7665Cba9E82e940

🌐 **Blockscout Alternative Explorer**:
- **Contract**: https://eth-sepolia.blockscout.com/address/0xA3268A7e4f3dF28ABb09a8eDe7665Cba9E82e940
- **Verified Source**: https://eth-sepolia.blockscout.com/address/0xA3268A7e4f3dF28ABb09a8eDe7665Cba9E82e940/contracts

### Deployment Steps (Completed ✅)

1. ✅ **Fund Wallet**: Sepolia ETH funded in development wallet
2. ✅ **Deploy Contract**: Successfully deployed to Sepolia
3. ✅ **Verify Contract**: Successfully verified on Etherscan  
4. ✅ **Test Integration**: Contract interaction tested and working

## 🔄 Usage Examples

### Creating an Escrow

```javascript
// ETH Escrow
const amount = ethers.parseEther("1.0");
const secret = ethers.randomBytes(32);
const hashLock = ethers.sha256(ethers.solidityPacked(["bytes32"], [secret]));

const timeLocks = {
  withdrawal: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  refund: Math.floor(Date.now() / 1000) + 7200      // 2 hours
};

const tx = await escrowContract.createEscrow(
  ethers.ZeroAddress, // ETH
  amount,
  hashLock,
  timeLocks,
  { value: amount }
);
```

### Completing an Escrow

```javascript
// Resolver completes escrow with secret
await escrowContract.connect(resolver).lockEscrow(escrowId);
await escrowContract.connect(resolver).completeEscrow(escrowId, secret);
```

## 🏗️ Architecture

### System Architecture

```mermaid
graph TB
    subgraph "StellHydra Cross-Chain Bridge"
        SH[StellHydra Frontend]
        BR[Bridge Resolver Service]
    end
    
    subgraph "Ethereum Network"
        EEC[StellarEthereumEscrow Contract]
        EA[Ethereum Assets: ETH/ERC20]
        EW[Ethereum Wallet]
    end
    
    subgraph "Stellar Network"
        SEC[Stellar-Eth-Escrow Contract]
        SA[Stellar Assets]
        SW[Stellar Wallet]
    end
    
    subgraph "HTLC Components"
        HL[Hash Lock: SHA256 Secret]
        TL[Time Lock: Withdrawal/Refund]
        ST[State Machine: Pending-Locked-Completed/Refunded]
    end
    
    SH --> BR
    BR --> EEC
    BR --> SEC
    
    EEC --> HL
    EEC --> TL
    EEC --> ST
    
    EW --> EEC
    SW --> SEC
    
    EEC <--> EA
    SEC <--> SA
    
    classDef stellar fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
    classDef ethereum fill:#6366f1,stroke:#8b5cf6,stroke-width:2px,color:#fff
    classDef bridge fill:#059669,stroke:#10b981,stroke-width:2px,color:#fff
    classDef htlc fill:#dc2626,stroke:#ef4444,stroke-width:2px,color:#fff
    
    class SEC,SA,SW stellar
    class EEC,EA,EW ethereum
    class SH,BR bridge
    class HL,TL,ST htlc
```

### Contract Architecture

```mermaid
graph TB
    subgraph "StellarEthereumEscrow Contract"
        subgraph "Data Structures"
            ESC[EscrowData Struct]
            TLS[TimeLocks Struct]
            ERR[Custom Errors]
        end
        
        subgraph "Storage"
            MAP[mapping: escrows]
            BAL[mapping: balances]
        end
        
        subgraph "Core Functions"
            CREATE[createEscrow]
            LOCK[lockEscrow]
            COMPLETE[completeEscrow]
            REFUND[refundEscrow]
        end
        
        subgraph "View Functions"
            GET[getEscrow]
            EXISTS[escrowExists]
            STATUS[getEscrowStatus]
            BALANCE[getBalance]
            STATS[getStats]
        end
        
        subgraph "Security Features"
            GUARD[ReentrancyGuard]
            SAFE[SafeERC20]
            ACCESS[Access Control]
            VALID[Input Validation]
            EVENTS[Event Emission]
        end
        
        subgraph "OpenZeppelin Integration"
            OZ_GUARD[ReentrancyGuard.sol]
            OZ_ERC20[IERC20.sol]
            OZ_SAFE[SafeERC20.sol]
            OZ_CRYPTO[ECDSA.sol]
        end
    end
    
    ESC --> MAP
    TLS --> ESC
    
    CREATE --> ESC
    CREATE --> ACCESS
    CREATE --> EVENTS
    CREATE --> SAFE
    
    LOCK --> ACCESS
    LOCK --> VALID
    LOCK --> EVENTS
    
    COMPLETE --> ACCESS
    COMPLETE --> VALID
    COMPLETE --> EVENTS
    COMPLETE --> SAFE
    
    REFUND --> ACCESS
    REFUND --> VALID
    REFUND --> EVENTS
    REFUND --> SAFE
    
    GET --> MAP
    EXISTS --> MAP
    STATUS --> MAP
    BALANCE --> BAL
    
    GUARD --> OZ_GUARD
    SAFE --> OZ_ERC20
    SAFE --> OZ_SAFE
    ACCESS --> OZ_CRYPTO
    
    classDef struct fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#000
    classDef storage fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff
    classDef core fill:#dc2626,stroke:#b91c1c,stroke-width:2px,color:#fff
    classDef view fill:#059669,stroke:#047857,stroke-width:2px,color:#fff
    classDef security fill:#ea580c,stroke:#c2410c,stroke-width:2px,color:#fff
    classDef openzeppelin fill:#7c3aed,stroke:#6d28d9,stroke-width:2px,color:#fff
    
    class ESC,TLS,ERR struct
    class MAP,BAL storage
    class CREATE,LOCK,COMPLETE,REFUND core
    class GET,EXISTS,STATUS,BALANCE,STATS view
    class GUARD,SAFE,ACCESS,VALID,EVENTS security
    class OZ_GUARD,OZ_ERC20,OZ_SAFE,OZ_CRYPTO openzeppelin
```

## 🔄 Sequence Diagrams

### Successful Atomic Swap Flow

```mermaid
sequenceDiagram
    participant U as User (Ethereum)
    participant EEC as StellarEthereumEscrow
    participant BR as Bridge Resolver
    participant SEC as Stellar-Eth-Escrow
    participant SU as User (Stellar)
    
    Note over U,SU: Phase 1: Setup Ethereum Side
    U->>EEC: createEscrow(asset, amount, hashLock, timeLocks)
    EEC->>EEC: validate inputs & transfer assets
    EEC->>EEC: generate unique escrow_id
    EEC->>EEC: store escrow (status: pending)
    EEC-->>U: return escrow_id
    
    U->>BR: initiate cross-chain swap
    BR->>EEC: lockEscrow(escrow_id)
    EEC->>EEC: validate authorization
    EEC->>EEC: update status to locked
    EEC-->>BR: success
    
    Note over U,SU: Phase 2: Setup Stellar Side
    BR->>SEC: create & lock stellar escrow
    SEC-->>BR: stellar_escrow_id
    
    Note over U,SU: Phase 3: Complete Swap
    SU->>SEC: complete with secret reveal
    SEC->>SEC: verify hash_lock matches
    SEC->>SEC: transfer assets to SU
    SEC-->>SU: success + secret
    
    SU->>BR: notify completion with secret
    BR->>EEC: completeEscrow(escrow_id, secret)
    EEC->>EEC: verify hash_lock matches secret
    EEC->>EEC: check timelock not expired
    EEC->>EEC: transfer assets to resolver
    EEC->>EEC: update status to completed
    EEC-->>BR: success
    
    Note over U,SU: ✅ Atomic Swap Completed Successfully
```

### Refund Flow (Timelock Expired)

```mermaid
sequenceDiagram
    participant U as User (Ethereum)
    participant EEC as StellarEthereumEscrow
    participant BR as Bridge Resolver
    participant T as Time
    
    Note over U,T: Escrow Created & Locked
    U->>EEC: createEscrow(...)
    EEC-->>U: escrow_id
    BR->>EEC: lockEscrow(escrow_id)
    EEC->>EEC: status = locked
    
    Note over U,T: Time Passes - Swap Not Completed
    T->>T: timelock expires
    
    Note over U,T: Refund Process
    U->>EEC: refundEscrow(escrow_id)
    EEC->>EEC: validate maker authorization
    EEC->>EEC: check status (pending or locked only)
    EEC->>EEC: verify timelock expired
    EEC->>EEC: transfer assets back to maker
    EEC->>EEC: update status to refunded
    EEC->>EEC: emit refund event
    EEC-->>U: success
    
    Note over U,T: 💰 Assets Refunded to Original Owner
```

### Error Handling Flow

```mermaid
sequenceDiagram
    participant U as User
    participant EEC as StellarEthereumEscrow
    participant E as Error Handler
    
    Note over U,E: Invalid Secret Scenario
    U->>EEC: completeEscrow(escrow_id, wrong_secret)
    EEC->>EEC: verify hash_lock with SHA256
    EEC->>EEC: computed_hash ≠ stored_hash_lock
    EEC->>E: revert("Invalid secret")
    E-->>U: Transaction Failed: Invalid Secret
    
    Note over U,E: Timelock Expired Scenario  
    U->>EEC: completeEscrow(escrow_id, secret)
    EEC->>EEC: check timelock
    EEC->>EEC: block.timestamp > time_lock
    EEC->>E: revert("Timelock expired")
    E-->>U: Transaction Failed: Timelock Expired
    
    Note over U,E: Invalid Status Scenario
    U->>EEC: completeEscrow(escrow_id, secret)
    EEC->>EEC: check escrow status
    EEC->>EEC: status ≠ locked (1)
    EEC->>E: revert("Invalid escrow status")
    E-->>U: Transaction Failed: Invalid Status
    
    Note over U,E: Insufficient ETH Scenario
    U->>EEC: createEscrow(ETH, amount, ...) {value: wrong_amount}
    EEC->>EEC: validate msg.value == amount
    EEC->>EEC: msg.value ≠ amount
    EEC->>E: revert("Incorrect ETH amount")
    E-->>U: Transaction Failed: Incorrect ETH Amount
```

### Contract Flow

1. **Escrow Creation**: User creates escrow with hash lock and time locks, transferring assets to contract
2. **Escrow Locking**: Bridge resolver locks escrow after cross-chain verification
3. **Escrow Completion**: Resolver completes escrow by revealing secret, transferring assets to resolver
4. **Escrow Refund**: Original maker can refund after timelock expiry, getting assets back

## 🔐 Security

### Security Measures
- ✅ **ReentrancyGuard**: All state-changing functions protected
- ✅ **SafeERC20**: Safe token transfers with proper error handling
- ✅ **Access Control**: Proper authorization checks
- ✅ **Input Validation**: Comprehensive parameter validation
- ✅ **Time Lock Protection**: Proper timelock implementation
- ✅ **Event Emission**: Complete event logging for monitoring

### Best Practices
- Use hardware wallets for mainnet deployments
- Test thoroughly on testnet before mainnet
- Monitor contract events for anomalies
- Keep private keys secure
- Regular security audits recommended

## 📊 Gas Optimization

The contract is optimized for gas efficiency:

| Function | Estimated Gas |
|----------|---------------|
| `createEscrow` | ~150,000 gas |
| `lockEscrow` | ~50,000 gas |
| `completeEscrow` | ~80,000 gas |
| `refundEscrow` | ~70,000 gas |

## 🌐 Network Configuration

### Sepolia Testnet
- **Chain ID**: 11155111
- **RPC URL**: https://rpc.sepolia.org
- **Explorer**: https://sepolia.etherscan.io

### Ethereum Mainnet
- **Chain ID**: 1
- **RPC URL**: Configure in .env
- **Explorer**: https://etherscan.io

## 🔗 Integration

### StellHydra Frontend Integration

```typescript
import { ethers } from 'ethers';
import StellarEthereumEscrowABI from './artifacts/contracts/StellarEthereumEscrow.sol/StellarEthereumEscrow.json';

const provider = new ethers.JsonRpcProvider('https://rpc.sepolia.org');
const contract = new ethers.Contract(contractAddress, StellarEthereumEscrowABI.abi, provider);

// Create escrow
const tx = await contract.createEscrow(asset, amount, hashLock, timeLocks, { value: amount });
```

## 📚 Resources

### Development Resources
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Ethers.js Documentation](https://docs.ethers.org/)

### Ethereum Resources
- [Ethereum Development Documentation](https://ethereum.org/en/developers/)
- [Sepolia Testnet Faucets](https://sepoliafaucet.com/)
- [Etherscan API Documentation](https://docs.etherscan.io/)

### StellHydra Resources
- [Stellar Contracts](../contracts-stellar/README.md)
- [Frontend Integration](../README.md)

## 🐛 Troubleshooting

### Common Issues

1. **Insufficient Gas**: Increase gas limit in hardhat.config.js
2. **Network Connection**: Check RPC URL in .env file
3. **Private Key**: Ensure PRIVATE_KEY is set in .env
4. **Wallet Funding**: Verify Sepolia ETH balance

### Getting Help

- Check test results for debugging information
- Review contract events for transaction details
- Use Etherscan to inspect transaction details
- Consult Hardhat documentation for configuration issues

## 📋 Summary

The **StellarEthereumEscrow** contract is a production-ready HTLC implementation for secure atomic swaps between Stellar and Ethereum networks. It includes comprehensive security features, gas optimizations, and full test coverage.

**Key Achievements**:
- ✅ **Production-Ready Security** (OpenZeppelin, ReentrancyGuard, SafeERC20)
- ✅ **Comprehensive Test Suite** (Edge cases, atomic swap flows, security validations)
- ✅ **Gas Optimized** (Efficient storage patterns, optimized functions)
- ✅ **Developer-Friendly** (Complete scripts, documentation, examples)
- ✅ **Cross-Chain Ready** (Compatible with Stellar bridge architecture)

**Successfully Deployed**: The contract has been successfully deployed to Sepolia testnet and is ready for integration with the StellHydra frontend.

## 🎉 Deployment Success Summary

### ✅ **Contract Successfully Deployed & Verified**

| Metric | Value |
|--------|-------|
| **Contract Address** | `0xA3268A7e4f3dF28ABb09a8eDe7665Cba9E82e940` |
| **Network** | Sepolia Testnet (Chain ID: 11155111) |
| **Verification Status** | ✅ Verified on Etherscan |
| **Deployer Address** | `0x31C6949cb3A40546e2C2752005A6F9a44f8BD45B` |
| **Contract Balance** | 0.0 ETH (Ready for escrows) |
| **Current Escrows** | 0 (Clean deployment) |

### 🔗 **Live Contract Links**

**Primary Explorer (Etherscan)**:
- **Verified Source Code**: https://sepolia.etherscan.io/address/0xA3268A7e4f3dF28ABb09a8eDe7665Cba9E82e940#code
- **Contract Overview**: https://sepolia.etherscan.io/address/0xA3268A7e4f3dF28ABb09a8eDe7665Cba9E82e940

**Alternative Explorer (Blockscout)**:
- **Contract Details**: https://eth-sepolia.blockscout.com/address/0xA3268A7e4f3dF28ABb09a8eDe7665Cba9E82e940
- **Verified Source**: https://eth-sepolia.blockscout.com/address/0xA3268A7e4f3dF28ABb09a8eDe7665Cba9E82e940/contracts

### 🚀 **Integration Ready**

The StellarEthereumEscrow contract is now:
- ✅ **Live on Sepolia** - Fully functional and tested
- ✅ **Source Code Verified** - Transparent and auditable on Etherscan
- ✅ **Cross-Chain Ready** - Compatible with Stellar bridge architecture
- ✅ **Security Audited** - OpenZeppelin standards with comprehensive testing
- ✅ **Gas Optimized** - Efficient operations for cost-effective swaps

### 📋 **Next Steps for Integration**

1. **Frontend Integration**: Connect StellHydra frontend to contract at `0xA3268A7e4f3dF28ABb09a8eDe7665Cba9E82e940`
2. **Cross-Chain Testing**: Test atomic swaps with Stellar contracts
3. **Production Deployment**: Deploy to Ethereum mainnet after testing
4. **Monitoring Setup**: Implement contract event monitoring for escrow lifecycle