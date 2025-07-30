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

1. **Deploy test contract to testnet**:
   ```bash
   ./scripts/deploy.sh testnet test-contract
   ```

2. **Deploy all contracts**:
   ```bash
   for contract in test-contract bridge-contract price-oracle; do
     ./scripts/deploy.sh testnet $contract
   done
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

## 🔐 Security

- Test thoroughly on testnet before mainnet deployment
- Use multi-signature for production deployments
- Implement proper access controls
- Monitor contract events
- Keep deployment records secure