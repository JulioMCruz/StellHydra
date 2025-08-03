# StellHydra Contracts Deployment Guide

Fixed deployment setup following the working Donaria pattern.

## 🚀 Quick Deploy bridge-contract

```bash
# Navigate to contracts directory
cd /Users/osx/Projects/ETHGlobal-UniteDefi/StellHydra/contracts-stellar

# Deploy bridge contract (simple method)
./deploy-bridge.sh
```

## 📋 Prerequisites

1. **Stellar CLI installed**:
   ```bash
   cargo install --locked stellar-cli
   ```

2. **Alice account setup** (done automatically by script):
   ```bash
   stellar keys generate alice --network testnet
   stellar keys fund alice --network testnet
   ```

## 🔧 Individual Contract Deployment

### Bridge Contract
```bash
cd bridge-contract
make setup-network    # Setup testnet
make fund-alice       # Fund alice account
make build           # Build contract
make deploy-testnet  # Deploy to testnet
```

### Stellar-ETH Escrow
```bash
cd stellar-eth-escrow
make setup-network
make fund-alice
make build
make deploy-testnet
```

### Simple Test Contract
```bash
cd simple-test
make setup-network
make fund-alice
make build
make deploy-testnet
```

## 🔍 What Was Fixed

1. **Soroban SDK Version**: Fixed to exact version `22.0.0`
2. **Workspace Dependencies**: Proper workspace dependency references
3. **Individual Makefiles**: Added deployment Makefiles for each contract
4. **Simple Deployment Script**: Created `deploy-bridge.sh` following Donaria pattern
5. **Bridge Contract**: Added to workspace members

## 📊 Deployment Status

- ✅ **bridge-contract**: Ready for deployment
- ✅ **stellar-eth-escrow**: Ready for deployment  
- ✅ **simple-test**: Ready for deployment

## 🌐 Network Configuration

- **Network**: Stellar Testnet
- **RPC URL**: https://soroban-testnet.stellar.org:443
- **Network Passphrase**: "Test SDF Network ; September 2015"
- **Explorer**: https://testnet.stellarchain.io/