# StellHydra Smart Contracts

Soroban smart contracts for the StellHydra cross-chain bridge DEX aggregator.

## 📁 Directory Structure

```
contracts/
├── test-contract/          # Simple test contract for deployment verification
├── bridge-contract/        # Main cross-chain bridge functionality
├── price-oracle/          # Price oracle for DEX aggregation
├── scripts/               # Deployment and testing scripts
├── config/                # Network configurations
└── deployments/           # Deployment history and contract addresses
```

## 📋 Deployed Contracts (Testnet)

### 🌟 **Active Deployments**

| Contract | Status | Contract ID | Description |
|----------|--------|-------------|-------------|
| **simple-test** | ✅ **Ready** | `READY_FOR_DEPLOYMENT` | Simple counter contract for testing |
| **test-contract** | 🔧 Fixing | `PENDING_DEPLOYMENT` | Enhanced test with data storage |
| **price-oracle** | 🔧 Fixing | `PENDING_DEPLOYMENT` | DEX price aggregation oracle |
| **liquidity-pool** | 🔧 Fixing | `PENDING_DEPLOYMENT` | AMM liquidity pool |
| **router** | 🔧 Fixing | `PENDING_DEPLOYMENT` | DEX aggregation router |
| **bridge-contract** | 🔧 Fixing | `PENDING_DEPLOYMENT` | Cross-chain bridge |

### 📊 **Deployment Status**

- **Network**: Stellar Testnet
- **Deployer**: `GBXPKLRTMHH3NWEE32YSLZMRSBBQ6ITJCME7FK3P5SB7XEKRNJN2F7IS`
- **WASM Hash** (simple-test): `1fd32eb24ec533df654525799d69a9ca5b71bc4241766a1976319703f70f06f7`

### 🔗 **Testnet Explorer Links**

- **Network**: [Stellar Testnet](https://testnet.stellarchain.io)
- **Account**: [View Deployer](https://testnet.stellarchain.io/accounts/GBXPKLRTMHH3NWEE32YSLZMRSBBQ6ITJCME7FK3P5SB7XEKRNJN2F7IS)

## 🚀 Quick Start

### Prerequisites

1. **Install Rust**:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source ~/.cargo/env
   ```

2. **Install Soroban CLI**:
   ```bash
   cargo install --locked soroban-cli
   ```

3. **Add WebAssembly target**:
   ```bash
   rustup target add wasm32-unknown-unknown
   ```

### Setup Accounts

1. **Generate test account**:
   ```bash
   soroban keys generate test-account
   ```

2. **Fund account on testnet**:
   ```bash
   soroban keys fund test-account --network testnet
   ```

### Build and Test

1. **Run all tests**:
   ```bash
   ./scripts/test.sh
   ```

2. **Test specific contract**:
   ```bash
   ./scripts/test.sh test-contract
   ```

### Deploy Contracts

#### ✅ **Working Simple Test Contract**

1. **Deploy simple test contract** (Ready now):
   ```bash
   cd simple-test
   soroban contract deploy --source stellhydra-test --network testnet \
     --wasm target/wasm32-unknown-unknown/release/simple_test.wasm
   ```

2. **Test the deployed contract**:
   ```bash
   # Initialize
   soroban contract invoke --id {CONTRACT_ID} --source stellhydra-test \
     --network testnet -- init
   
   # Increment counter
   soroban contract invoke --id {CONTRACT_ID} --source stellhydra-test \
     --network testnet -- increment
   
   # Get count
   soroban contract invoke --id {CONTRACT_ID} --source stellhydra-test \
     --network testnet -- get_count
   ```

#### 🔧 **Contracts Under Development**

The other contracts need Soroban SDK compatibility fixes:

1. **Fix and deploy remaining contracts**:
   ```bash
   # After fixes are applied:
   ./scripts/deploy.sh testnet test-contract
   ./scripts/deploy.sh testnet price-oracle
   ./scripts/deploy.sh testnet liquidity-pool
   ./scripts/deploy.sh testnet router
   ./scripts/deploy.sh testnet bridge-contract
   ```

## 📋 Contract Overview

### 🧪 Test Contract (`test-contract`)

Simple contract for deployment verification with:
- Initialization with owner and message
- Counter functionality (increment/reset)
- Message updates (owner only)
- Event emission for all operations

**Key Functions**:
- `initialize(owner, message)` - Set up contract
- `hello(name)` - Simple greeting function
- `increment()` - Increment counter (public)
- `reset()` - Reset counter (owner only)

### 🌉 Bridge Contract (`bridge-contract`)

Main cross-chain bridge functionality:
- Asset locking/unlocking
- Cross-chain transaction verification
- Multi-signature support
- Emergency pause functionality

### 📊 Price Oracle (`price-oracle`)

DEX price aggregation:
- Multi-oracle price feeds
- Price staleness checks
- Authorized oracle management
- Price update events

## 🔧 Configuration

### Network Settings

**Testnet** (`config/testnet.toml`):
- Network: Test SDF Network
- RPC: https://soroban-testnet.stellar.org
- Explorer: https://testnet.stellarchain.io

**Mainnet** (`config/mainnet.toml`):
- Network: Public Global Stellar Network
- RPC: https://soroban-rpc.stellar.org
- Explorer: https://stellarchain.io

### Environment Variables

Set these environment variables for deployment:

```bash
# Testnet
export TESTNET_DEPLOYER_SECRET="test-account"
export TESTNET_DEPLOYER_ADDRESS="GXXXXX..."

# Mainnet (production)
export MAINNET_DEPLOYER_SECRET="production-account"
export MAINNET_DEPLOYER_ADDRESS="GXXXXX..."
```

## 🧪 Testing

### Unit Tests

Each contract includes comprehensive unit tests:

```bash
# Run tests for specific contract
cd test-contract
cargo test --features testutils

# Run with output
cargo test --features testutils -- --nocapture
```

### Integration Testing

The test script (`scripts/test.sh`) runs:
- Contract compilation
- Unit test execution
- Build verification
- Dependency checks

## 🚀 Deployment

### Deployment Process

1. **Build** - Compile contract to WebAssembly
2. **Deploy** - Upload to Stellar network
3. **Initialize** - Set up contract state
4. **Verify** - Test basic functionality
5. **Record** - Save deployment info

### Deployment Files

Successful deployments create JSON files in `deployments/`:

```json
{
  "network": "testnet",
  "contract_name": "test-contract",
  "contract_id": "CXXXXXX...",
  "deployed_at": "2024-01-01T00:00:00Z",
  "deployer": "GXXXXXX...",
  "wasm_file": "target/wasm32-unknown-unknown/release/stellhydra_test.wasm"
}
```

## 🔍 Monitoring

### Contract Events

All contracts emit events for monitoring:

**Test Contract**:
- `(TEST, INIT)` - Contract initialization
- `(TEST, UPDATE)` - Message updates
- `(TEST, INC)` - Counter increments
- `(TEST, RESET)` - Counter resets

**Price Oracle**:
- `(PRICE, UPDATE)` - Price updates

### Explorer Integration

View contracts on Stellar explorers:
- **Testnet**: https://testnet.stellarchain.io/contract/{CONTRACT_ID}
- **Mainnet**: https://stellarchain.io/contract/{CONTRACT_ID}

## 🛠️ Development

### Adding New Contracts

1. Create contract directory:
   ```bash
   mkdir new-contract
   cd new-contract
   ```

2. Add `Cargo.toml`:
   ```toml
   [package]
   name = "new-contract"
   version = "0.1.0"
   edition = "2021"

   [lib]
   crate-type = ["cdylib"]

   [dependencies]
   soroban-sdk = { workspace = true }
   ```

3. Update workspace `Cargo.toml`:
   ```toml
   members = [
     "test-contract",
     "bridge-contract",
     "price-oracle",
     "new-contract",  # Add here
   ]
   ```

### Code Standards

- Use `#![no_std]` for all contracts
- Include comprehensive unit tests
- Emit events for important operations
- Implement proper error handling
- Follow Soroban best practices

## 📚 Resources

- [Soroban Documentation](https://soroban.stellar.org/docs)
- [Stellar Developer Portal](https://developers.stellar.org/)
- [Soroban Examples](https://github.com/stellar/soroban-examples)
- [Rust Book](https://doc.rust-lang.org/book/)

## 🐛 Troubleshooting

### Common Issues

1. **XDR Processing Error**:
   ```bash
   error: xdr processing error: xdr value invalid
   ```
   **Solution**: Check network connectivity and account funding
   
2. **Contract Build Failures**:
   - Remove complex event structures
   - Use simple data types in events
   - Avoid `format!` macro in `#![no_std]` contracts

3. **Token Contract Dependencies**:
   ```bash
   error: no matching package named `soroban-token-contract`
   ```
   **Solution**: Use Soroban SDK token interface directly

### Development Status

**Working**: 
- ✅ Simple test contract (deployed to testnet)
- ✅ Contract build system
- ✅ Deployment scripts

**In Progress**: 
- 🔧 Complex contracts (events, token integration)
- 🔧 Cross-chain bridge logic
- 🔧 DEX aggregation features

## 🔐 Security

- Test thoroughly on testnet before mainnet deployment
- Use multi-signature for production deployments
- Implement proper access controls
- Monitor contract events
- Keep deployment records secure

## 🚀 Next Steps

1. **Fix remaining contracts** for Soroban SDK compatibility
2. **Complete testnet deployment** of all contracts
3. **Integration testing** with frontend application
4. **Mainnet deployment** after thorough testing