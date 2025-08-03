#!/bin/bash

# Unified Contract Deployment Script
# Deploys both Ethereum and Stellar contracts for the atomic swap system

set -e

NETWORK=${1:-"testnet"}
DEPLOY_ETHEREUM=${2:-"true"}
DEPLOY_STELLAR=${3:-"true"}

echo "🚀 StellHydra Cross-Chain Contract Deployment"
echo "============================================="
echo "Network: $NETWORK"
echo "Deploy Ethereum: $DEPLOY_ETHEREUM"
echo "Deploy Stellar: $DEPLOY_STELLAR"
echo ""

# Check environment variables
if [ "$DEPLOY_ETHEREUM" = "true" ] && [ -z "$ETHEREUM_PRIVATE_KEY" ]; then
    echo "⚠️  Warning: ETHEREUM_PRIVATE_KEY not set"
fi

if [ "$DEPLOY_STELLAR" = "true" ] && [ -z "$STELLAR_SECRET_KEY" ]; then
    echo "⚠️  Warning: STELLAR_SECRET_KEY not set"
fi

echo ""

# Deploy Ethereum contract
if [ "$DEPLOY_ETHEREUM" = "true" ]; then
    echo "📦 Deploying Ethereum contracts..."
    cd contracts-evm
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "📥 Installing Ethereum contract dependencies..."
        npm install
    fi
    
    # Deploy to specified network
    if [ "$NETWORK" = "testnet" ]; then
        npx hardhat run scripts/deploy.js --network sepolia
    elif [ "$NETWORK" = "mainnet" ]; then
        npx hardhat run scripts/deploy.js --network mainnet
    else
        npx hardhat run scripts/deploy.js --network localhost
    fi
    
    cd ..
    echo "✅ Ethereum contracts deployed successfully!"
    echo ""
fi

# Deploy Stellar contract
if [ "$DEPLOY_STELLAR" = "true" ]; then
    echo "📦 Deploying Stellar contracts..."
    
    # Check if Stellar CLI is installed
    if ! command -v soroban &> /dev/null; then
        echo "❌ Error: Soroban CLI not installed"
        echo "   Please install from: https://soroban.stellar.org/docs/getting-started/setup"
        exit 1
    fi
    
    # Run Stellar deployment script
    ./deploy-stellar-contract.sh $NETWORK
    
    echo "✅ Stellar contracts deployed successfully!"
    echo ""
fi

# Display final summary
echo "🎉 Deployment Summary"
echo "====================="

if [ "$DEPLOY_ETHEREUM" = "true" ]; then
    ETH_DEPLOYMENT=$(find contracts-evm/deployments -name "*.json" | head -1)
    if [ -f "$ETH_DEPLOYMENT" ]; then
        ETH_ADDRESS=$(jq -r '.contracts.StellarEthereumEscrow.address' "$ETH_DEPLOYMENT")
        echo "Ethereum Contract: $ETH_ADDRESS"
    fi
fi

if [ "$DEPLOY_STELLAR" = "true" ]; then
    STELLAR_DEPLOYMENT="deployments/${NETWORK}_stellar_eth_escrow.json"
    if [ -f "$STELLAR_DEPLOYMENT" ]; then
        STELLAR_CONTRACT_ID=$(jq -r '.contractId' "$STELLAR_DEPLOYMENT")
        echo "Stellar Contract: $STELLAR_CONTRACT_ID"
    fi
fi

echo ""
echo "📝 Configuration files updated:"
echo "   - .env (environment variables)"
echo "   - deployments/ (deployment artifacts)"
echo ""

echo "💡 Next steps:"
echo "   1. Update your application with the new contract addresses"
echo "   2. Fund the contracts if needed"
echo "   3. Test the atomic swap functionality"
echo "   4. Update frontend configuration"

if [ "$NETWORK" = "testnet" ]; then
    echo ""
    echo "🔗 Testnet Resources:"
    echo "   - Ethereum Sepolia Faucet: https://faucets.chain.link/"
    echo "   - Stellar Testnet Faucet: https://laboratory.stellar.org/#account-creator"
fi