#!/bin/bash

# StellHydra Smart Contract Testing Script
# Usage: ./test.sh [contract-name]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

CONTRACT=${1:-all}
CONTRACTS_DIR="."

echo -e "${BLUE}🧪 StellHydra Contract Testing${NC}"
echo -e "${BLUE}Target: ${CONTRACT}${NC}"
echo ""

# Check if cargo is installed
if ! command -v cargo &> /dev/null; then
    echo -e "${RED}❌ Cargo is not installed${NC}"
    echo -e "${YELLOW}Please install Rust and Cargo from https://rustup.rs/${NC}"
    exit 1
fi

# Function to test a single contract
test_contract() {
    local contract_name="$1"
    
    if [ ! -d "$contract_name" ]; then
        echo -e "${RED}❌ Contract directory '$contract_name' not found${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}🔍 Testing $contract_name...${NC}"
    cd "$contract_name"
    
    # Run tests
    if cargo test --features testutils; then
        echo -e "${GREEN}✅ Tests passed for $contract_name${NC}"
        cd ..
        return 0
    else
        echo -e "${RED}❌ Tests failed for $contract_name${NC}"
        cd ..
        return 1
    fi
}

# Function to build a single contract
build_contract() {
    local contract_name="$1"
    
    if [ ! -d "$contract_name" ]; then
        echo -e "${RED}❌ Contract directory '$contract_name' not found${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}🔨 Building $contract_name...${NC}"
    cd "$contract_name"
    
    # Build contract
    if soroban contract build 2>/dev/null; then
        echo -e "${GREEN}✅ Build successful for $contract_name${NC}"
        cd ..
        return 0
    else
        echo -e "${YELLOW}⚠️  Soroban CLI not available, using cargo build${NC}"
        if cargo build --target wasm32-unknown-unknown --release; then
            echo -e "${GREEN}✅ Cargo build successful for $contract_name${NC}"
            cd ..
            return 0
        else
            echo -e "${RED}❌ Build failed for $contract_name${NC}"
            cd ..
            return 1
        fi
    fi
}

# Test specific contract or all contracts
if [ "$CONTRACT" = "all" ]; then
    echo -e "${YELLOW}📋 Running tests for all contracts...${NC}"
    
    failed_contracts=()
    
    # Find all contract directories
    for dir in */; do
        if [ -f "${dir}Cargo.toml" ] && [ -f "${dir}src/lib.rs" ]; then
            contract_name=${dir%/}
            echo ""
            echo -e "${BLUE}Testing $contract_name${NC}"
            
            if build_contract "$contract_name" && test_contract "$contract_name"; then
                echo -e "${GREEN}✅ $contract_name: All tests passed${NC}"
            else
                echo -e "${RED}❌ $contract_name: Tests failed${NC}"
                failed_contracts+=("$contract_name")
            fi
        fi
    done
    
    echo ""
    echo -e "${BLUE}📊 Test Summary${NC}"
    
    if [ ${#failed_contracts[@]} -eq 0 ]; then
        echo -e "${GREEN}🎉 All contracts passed their tests!${NC}"
    else
        echo -e "${RED}❌ Failed contracts: ${failed_contracts[*]}${NC}"
        exit 1
    fi
    
else
    # Test specific contract
    echo ""
    if build_contract "$CONTRACT" && test_contract "$CONTRACT"; then
        echo ""
        echo -e "${GREEN}🎉 All tests passed for $CONTRACT!${NC}"
    else
        echo ""
        echo -e "${RED}❌ Tests failed for $CONTRACT${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}✅ Testing complete!${NC}"