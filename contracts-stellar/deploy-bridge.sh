#!/bin/bash

# Simple deployment script for bridge-contract (following Donaria pattern)
set -e

echo "🚀 Deploying StellHydra Bridge Contract"

# Setup network if needed
echo "📋 Setting up testnet..."
stellar network add \
    --global testnet \
    --rpc-url https://soroban-testnet.stellar.org:443 \
    --network-passphrase "Test SDF Network ; September 2015" || true

# Fund alice if needed
echo "💰 Funding alice account..."
stellar keys fund alice --network testnet || true

# Build the contract
echo "🔨 Building bridge contract..."
cd bridge-contract
stellar contract build

# Check if WASM file exists
WASM_FILE="../target/wasm32v1-none/release/stellhydra_bridge.wasm"
if [ ! -f "$WASM_FILE" ]; then
    echo "❌ WASM file not found: $WASM_FILE"
    echo "Available files:"
    ls -la ../target/wasm32v1-none/release/ || echo "No release directory found"
    exit 1
fi

echo "✅ Build successful, WASM file: $WASM_FILE"

# Deploy the contract
echo "🚀 Deploying to testnet..."
CONTRACT_ID=$(stellar contract deploy \
    --wasm "$WASM_FILE" \
    --source alice \
    --network testnet)

if [ $? -eq 0 ]; then
    echo "✅ Bridge contract deployed successfully!"
    echo "📋 Contract ID: $CONTRACT_ID"
    echo "🌐 Explorer: https://testnet.stellarchain.io/contracts/$CONTRACT_ID"
    
    # Save deployment info
    echo "{\"contract_id\": \"$CONTRACT_ID\", \"deployed_at\": \"$(date)\", \"network\": \"testnet\"}" > ../deployments/bridge_testnet.json
    echo "💾 Deployment info saved to ../deployments/bridge_testnet.json"
else
    echo "❌ Deployment failed"
    exit 1
fi

cd ..