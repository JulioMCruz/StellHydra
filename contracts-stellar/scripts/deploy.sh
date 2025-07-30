#!/bin/bash

# StellHydra Smart Contract Deployment Script
# Usage: ./deploy.sh [testnet|mainnet] [contract-name]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NETWORK=${1:-testnet}
CONTRACT=${2:-stellar-eth-escrow}
CONFIG_DIR="./config"
CONTRACTS_DIR="."

echo -e "${BLUE}🚀 StellHydra Contract Deployment${NC}"
echo -e "${BLUE}Network: ${NETWORK}${NC}"
echo -e "${BLUE}Contract: ${CONTRACT}${NC}"
echo ""

# Check if soroban CLI is installed
if ! command -v soroban &> /dev/null; then
    echo -e "${RED}❌ Soroban CLI is not installed${NC}"
    echo -e "${YELLOW}Please install it with: cargo install --locked soroban-cli${NC}"
    exit 1
fi

# Check if contract exists
if [ ! -d "${CONTRACT}" ]; then
    echo -e "${RED}❌ Contract directory '${CONTRACT}' not found${NC}"
    echo -e "${YELLOW}Available contracts:${NC}"
    ls -d */ | grep -v scripts | grep -v config
    exit 1
fi

# Load network configuration
CONFIG_FILE="${CONFIG_DIR}/${NETWORK}.toml"
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}❌ Network configuration file not found: ${CONFIG_FILE}${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Loading network configuration...${NC}"
source "${CONFIG_DIR}/load_config.sh" "$NETWORK"

# Build the contract
echo -e "${YELLOW}🔨 Building contract...${NC}"
cd "${CONTRACT}"
soroban contract build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

WASM_FILE="target/wasm32-unknown-unknown/release/${CONTRACT//-/_}.wasm"
if [ ! -f "$WASM_FILE" ]; then
    echo -e "${RED}❌ WASM file not found: ${WASM_FILE}${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"

# Deploy to network
echo -e "${YELLOW}🚀 Deploying to ${NETWORK}...${NC}"

# Install the contract
echo -e "${YELLOW}📦 Installing contract...${NC}"
CONTRACT_ID=$(soroban contract deploy \
    --wasm "$WASM_FILE" \
    --source "$DEPLOYER_SECRET" \
    --network "$NETWORK" \
    2>&1)

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed${NC}"
    echo "$CONTRACT_ID"
    exit 1
fi

echo -e "${GREEN}✅ Contract deployed successfully!${NC}"
echo -e "${GREEN}Contract ID: ${CONTRACT_ID}${NC}"

# Save deployment info
DEPLOYMENT_FILE="../deployments/${NETWORK}_${CONTRACT}.json"
mkdir -p "../deployments"

cat > "$DEPLOYMENT_FILE" << EOF
{
  "network": "$NETWORK",
  "contract_name": "$CONTRACT",
  "contract_id": "$CONTRACT_ID",
  "deployed_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "deployer": "$DEPLOYER_ADDRESS",
  "wasm_file": "$WASM_FILE",
  "build_info": {
    "rust_version": "$(rustc --version)",
    "soroban_version": "$(soroban --version)"
  }
}
EOF

echo -e "${GREEN}✅ Deployment info saved to: ${DEPLOYMENT_FILE}${NC}"

# Initialize contract if it's the test contract
if [ "$CONTRACT" = "test-contract" ]; then
    echo -e "${YELLOW}🔧 Initializing test contract...${NC}"
    
    INIT_RESULT=$(soroban contract invoke \
        --id "$CONTRACT_ID" \
        --source "$DEPLOYER_SECRET" \
        --network "$NETWORK" \
        -- \
        initialize \
        --owner "$DEPLOYER_ADDRESS" \
        --initial_message "Hello from StellHydra on ${NETWORK}!" 2>&1)
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Contract initialized successfully${NC}"
        
        # Test the contract
        echo -e "${YELLOW}🧪 Testing contract...${NC}"
        
        HELLO_RESULT=$(soroban contract invoke \
            --id "$CONTRACT_ID" \
            --source "$DEPLOYER_SECRET" \
            --network "$NETWORK" \
            -- \
            hello \
            --name "StellHydra" 2>&1)
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Test successful: ${HELLO_RESULT}${NC}"
        else
            echo -e "${YELLOW}⚠️  Test failed: ${HELLO_RESULT}${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Initialization failed: ${INIT_RESULT}${NC}"
    fi
fi

echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${BLUE}Contract ID: ${CONTRACT_ID}${NC}"
echo -e "${BLUE}Network: ${NETWORK}${NC}"
echo -e "${BLUE}Explorer: ${EXPLORER_URL}/contract/${CONTRACT_ID}${NC}"
echo ""

cd ..