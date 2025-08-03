#!/bin/bash

# 🚀 StellHydra + 1inch Fusion+ Contract Deployment Script
# This script deploys all contracts to testnet

set -e

echo "🚀 Starting StellHydra + 1inch Fusion+ Contract Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    # Check for Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    # Check for npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    # Check for Rust
    if ! command -v rustc &> /dev/null; then
        print_error "Rust is not installed. Please install Rust first."
        exit 1
    fi
    
    # Check for Soroban CLI
    if ! command -v soroban &> /dev/null; then
        print_error "Soroban CLI is not installed. Please install Soroban CLI first."
        exit 1
    fi
    
    # Check for Hardhat
    if ! npx hardhat --version &> /dev/null; then
        print_warning "Hardhat not found. Installing..."
        npm install -g hardhat
    fi
    
    print_success "All dependencies are installed!"
}

# Deploy Stellar contracts
deploy_stellar_contracts() {
    print_status "Deploying Stellar contracts to testnet..."
    
    cd contracts-stellar
    
    # Build all contracts
    print_status "Building Stellar contracts..."
    cargo build --target wasm32-unknown-unknown --release
    
    # Deploy Bridge Contract
    print_status "Deploying Bridge Contract..."
    BRIDGE_CONTRACT=$(soroban contract deploy --network testnet --source target/wasm32-unknown-unknown/release/bridge_contract.wasm)
    print_success "Bridge Contract deployed: $BRIDGE_CONTRACT"
    
    # Deploy Stellar-Ethereum Escrow
    print_status "Deploying Stellar-Ethereum Escrow..."
    ESCROW_CONTRACT=$(soroban contract deploy --network testnet --source target/wasm32-unknown-unknown/release/stellar_eth_escrow.wasm)
    print_success "Escrow Contract deployed: $ESCROW_CONTRACT"
    
    # Deploy Router
    print_status "Deploying Router..."
    ROUTER_CONTRACT=$(soroban contract deploy --network testnet --source target/wasm32-unknown-unknown/release/router.wasm)
    print_success "Router Contract deployed: $ROUTER_CONTRACT"
    
    # Deploy Price Oracle
    print_status "Deploying Price Oracle..."
    PRICE_ORACLE_CONTRACT=$(soroban contract deploy --network testnet --source target/wasm32-unknown-unknown/release/price_oracle.wasm)
    print_success "Price Oracle Contract deployed: $PRICE_ORACLE_CONTRACT"
    
    # Deploy Liquidity Pool
    print_status "Deploying Liquidity Pool..."
    LIQUIDITY_POOL_CONTRACT=$(soroban contract deploy --network testnet --source target/wasm32-unknown-unknown/release/liquidity_pool.wasm)
    print_success "Liquidity Pool Contract deployed: $LIQUIDITY_POOL_CONTRACT"
    
    # Save contract addresses
    cat > deployed_addresses.json << EOF
{
    "stellar": {
        "bridgeContract": "$BRIDGE_CONTRACT",
        "escrowContract": "$ESCROW_CONTRACT",
        "routerContract": "$ROUTER_CONTRACT",
        "priceOracleContract": "$PRICE_ORACLE_CONTRACT",
        "liquidityPoolContract": "$LIQUIDITY_POOL_CONTRACT",
        "network": "testnet",
        "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    }
}
EOF
    
    print_success "Stellar contracts deployed successfully!"
    cd ..
}

# Deploy EVM contracts
deploy_evm_contracts() {
    print_status "Deploying EVM contracts to testnets..."
    
    cd contracts-evm
    
    # Install dependencies
    print_status "Installing EVM contract dependencies..."
    npm install
    
    # Deploy to Sepolia
    print_status "Deploying to Sepolia testnet..."
    npx hardhat run scripts/deploy.js --network sepolia
    
    # Deploy to Polygon Mumbai
    print_status "Deploying to Polygon Mumbai testnet..."
    npx hardhat run scripts/deploy.js --network mumbai
    
    # Deploy to BSC Testnet
    print_status "Deploying to BSC testnet..."
    npx hardhat run scripts/deploy.js --network bscTestnet
    
    print_success "EVM contracts deployed successfully!"
    cd ..
}

# Update environment configuration
update_environment() {
    print_status "Updating environment configuration..."
    
    # Read deployed addresses
    if [ -f "contracts-stellar/deployed_addresses.json" ]; then
        STELLAR_ADDRESSES=$(cat contracts-stellar/deployed_addresses.json)
        print_success "Stellar contract addresses loaded"
    fi
    
    if [ -f "contracts-evm/deployments/sepolia_11155111.json" ]; then
        SEPOLIA_ADDRESSES=$(cat contracts-evm/deployments/sepolia_11155111.json)
        print_success "Sepolia contract addresses loaded"
    fi
    
    # Create environment template
    cat > .env.template << EOF
# StellHydra + 1inch Fusion+ Environment Configuration
# Generated on $(date)

# 1inch Fusion+ API Configuration
FUSION_PLUS_API_KEY=your_1inch_fusion_plus_api_key_here
FUSION_PLUS_API_URL=https://api.1inch.dev/fusion-plus

# Testnet Configuration
STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
STELLAR_RPC_URL=https://horizon-testnet.stellar.org

# EVM Testnet Configuration
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
POLYGON_MUMBAI_RPC_URL=https://polygon-mumbai.infura.io/v3/YOUR_INFURA_KEY
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545

# Contract Addresses (Update these with your deployed addresses)
STELLAR_BRIDGE_CONTRACT_ADDRESS=your_deployed_stellar_bridge_address
STELLAR_ESCROW_CONTRACT_ADDRESS=your_deployed_stellar_escrow_address
STELLAR_ROUTER_CONTRACT_ADDRESS=your_deployed_stellar_router_address
STELLAR_PRICE_ORACLE_CONTRACT_ADDRESS=your_deployed_stellar_price_oracle_address
STELLAR_LIQUIDITY_POOL_CONTRACT_ADDRESS=your_deployed_stellar_liquidity_pool_address

SEPOLIA_BRIDGE_CONTRACT_ADDRESS=your_deployed_sepolia_bridge_address
SEPOLIA_ESCROW_CONTRACT_ADDRESS=your_deployed_sepolia_escrow_address
SEPOLIA_ROUTER_CONTRACT_ADDRESS=your_deployed_sepolia_router_address

POLYGON_MUMBAI_BRIDGE_CONTRACT_ADDRESS=your_deployed_polygon_bridge_address
POLYGON_MUMBAI_ESCROW_CONTRACT_ADDRESS=your_deployed_polygon_escrow_address
POLYGON_MUMBAI_ROUTER_CONTRACT_ADDRESS=your_deployed_polygon_router_address

BSC_TESTNET_BRIDGE_CONTRACT_ADDRESS=your_deployed_bsc_bridge_address
BSC_TESTNET_ESCROW_CONTRACT_ADDRESS=your_deployed_bsc_escrow_address
BSC_TESTNET_ROUTER_CONTRACT_ADDRESS=your_deployed_bsc_router_address
EOF
    
    print_success "Environment template created: .env.template"
    print_warning "Please update .env.template with your actual contract addresses and API keys"
}

# Verify contracts
verify_contracts() {
    print_status "Verifying contracts..."
    
    # Verify EVM contracts on Etherscan
    cd contracts-evm
    
    print_status "Verifying Sepolia contracts on Etherscan..."
    npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS
    
    print_status "Verifying Polygon Mumbai contracts on Polygonscan..."
    npx hardhat verify --network mumbai DEPLOYED_CONTRACT_ADDRESS
    
    print_status "Verifying BSC testnet contracts on BscScan..."
    npx hardhat verify --network bscTestnet DEPLOYED_CONTRACT_ADDRESS
    
    cd ..
    
    print_success "Contract verification completed!"
}

# Run tests
run_tests() {
    print_status "Running deployment tests..."
    
    # Test Fusion+ integration
    print_status "Testing Fusion+ integration..."
    npm run test:fusion-plus
    
    # Test cross-chain functionality
    print_status "Testing cross-chain functionality..."
    npm run test:cross-chain
    
    print_success "All tests passed!"
}

# Main deployment function
main() {
    print_status "Starting StellHydra + 1inch Fusion+ deployment..."
    
    # Check dependencies
    check_dependencies
    
    # Deploy Stellar contracts
    deploy_stellar_contracts
    
    # Deploy EVM contracts
    deploy_evm_contracts
    
    # Update environment configuration
    update_environment
    
    # Verify contracts
    verify_contracts
    
    # Run tests
    run_tests
    
    print_success "🎉 Deployment completed successfully!"
    print_status "Next steps:"
    print_status "1. Update .env.template with your actual contract addresses"
    print_status "2. Copy .env.template to .env.local and add your API keys"
    print_status "3. Test the integration with real contracts"
    print_status "4. Deploy to production when ready"
}

# Run main function
main "$@" 