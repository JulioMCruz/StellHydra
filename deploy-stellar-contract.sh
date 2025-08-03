#!/bin/bash

# Stellar Contract Deployment Script
# This script deploys the Stellar ETH Escrow contract to Stellar testnet/mainnet

set -e

NETWORK=${1:-"testnet"}
DEPLOYER_SECRET=${STELLAR_SECRET_KEY:-""}

echo "🚀 Deploying Stellar ETH Escrow Contract to $NETWORK"

if [ -z "$DEPLOYER_SECRET" ]; then
    echo "❌ Error: STELLAR_SECRET_KEY environment variable not set"
    exit 1
fi

# Navigate to Stellar contracts directory
cd contracts-stellar/stellar-eth-escrow

echo "📦 Building contract..."
make build

echo "📤 Deploying contract to $NETWORK..."

if [ "$NETWORK" = "testnet" ]; then
    SOROBAN_RPC_URL="https://soroban-rpc.testnet.stellar.org"
    SOROBAN_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
else
    SOROBAN_RPC_URL="https://soroban-rpc.mainnet.stellar.org"
    SOROBAN_NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"
fi

# Deploy the contract
CONTRACT_ID=$(soroban contract deploy \
    --source $DEPLOYER_SECRET \
    --rpc-url $SOROBAN_RPC_URL \
    --network-passphrase "$SOROBAN_NETWORK_PASSPHRASE" \
    --wasm ../../target/wasm32v1-none/release/stellar_eth_escrow.wasm)

echo "✅ Contract deployed successfully!"
echo "📍 Contract ID: $CONTRACT_ID"

# Save deployment info
DEPLOYMENT_FILE="../../deployments/${NETWORK}_stellar_eth_escrow.json"
mkdir -p ../../deployments

cat > $DEPLOYMENT_FILE << EOF
{
  "contractId": "$CONTRACT_ID",
  "network": "$NETWORK",
  "rpcUrl": "$SOROBAN_RPC_URL",
  "networkPassphrase": "$SOROBAN_NETWORK_PASSPHRASE",
  "deployedAt": "$(date -Iseconds)",
  "deployer": "$(soroban keys address $DEPLOYER_SECRET)"
}
EOF

echo "💾 Deployment info saved to: $DEPLOYMENT_FILE"

# Initialize the contract
echo "🔧 Initializing contract..."
soroban contract invoke \
    --source $DEPLOYER_SECRET \
    --rpc-url $SOROBAN_RPC_URL \
    --network-passphrase "$SOROBAN_NETWORK_PASSPHRASE" \
    --id $CONTRACT_ID \
    -- initialize

echo "✅ Contract initialized successfully!"

# Update environment configuration
echo "📝 Updating environment configuration..."
ENV_FILE="../../.env"

if [ -f "$ENV_FILE" ]; then
    # Update existing .env file
    if grep -q "STELLAR_CONTRACT_ID" "$ENV_FILE"; then
        sed -i.bak "s/STELLAR_CONTRACT_ID=.*/STELLAR_CONTRACT_ID=$CONTRACT_ID/" "$ENV_FILE"
    else
        echo "STELLAR_CONTRACT_ID=$CONTRACT_ID" >> "$ENV_FILE"
    fi
else
    # Create new .env file
    cat > "$ENV_FILE" << EOF
# Stellar Configuration
STELLAR_NETWORK=$NETWORK
STELLAR_CONTRACT_ID=$CONTRACT_ID
STELLAR_SECRET_KEY=$DEPLOYER_SECRET
EOF
fi

echo "🎉 Deployment completed successfully!"
echo "📋 Summary:"
echo "   Network: $NETWORK"
echo "   Contract ID: $CONTRACT_ID"
echo "   RPC URL: $SOROBAN_RPC_URL"
echo ""
echo "🔗 You can verify the contract at:"
if [ "$NETWORK" = "testnet" ]; then
    echo "   https://stellar.expert/explorer/testnet/contract/$CONTRACT_ID"
else
    echo "   https://stellar.expert/explorer/public/contract/$CONTRACT_ID"
fi

echo ""
echo "💡 Next steps:"
echo "   1. Fund the contract if needed"
echo "   2. Update your application configuration"
echo "   3. Test the contract functions"