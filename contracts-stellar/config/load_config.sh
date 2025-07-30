#!/bin/bash

# Load network configuration script
# Usage: source load_config.sh [network]

NETWORK=${1:-testnet}
CONFIG_FILE="./config/${NETWORK}.toml"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "Configuration file not found: $CONFIG_FILE"
    exit 1
fi

# Parse TOML and export as environment variables
parse_toml() {
    local file="$1"
    while IFS= read -r line; do
        # Skip comments and empty lines
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        [[ -z "${line// }" ]] && continue
        
        # Parse key = "value" format
        if [[ "$line" =~ ^[[:space:]]*([^=]+)[[:space:]]*=[[:space:]]*\"([^\"]+)\"[[:space:]]*$ ]]; then
            key="${BASH_REMATCH[1]// /}"
            value="${BASH_REMATCH[2]}"
            
            # Convert to uppercase for environment variables
            env_var=$(echo "$key" | tr '[:lower:]' '[:upper:]')
            export "$env_var"="$value"
            
        # Parse key = value format (numbers)
        elif [[ "$line" =~ ^[[:space:]]*([^=]+)[[:space:]]*=[[:space:]]*([0-9]+)[[:space:]]*$ ]]; then
            key="${BASH_REMATCH[1]// /}"
            value="${BASH_REMATCH[2]}"
            
            env_var=$(echo "$key" | tr '[:lower:]' '[:upper:]')
            export "$env_var"="$value"
        fi
    done < "$file"
}

parse_toml "$CONFIG_FILE"

# Set additional derived variables
export NETWORK_NAME="$NETWORK"

# Set deployer account based on network
if [ "$NETWORK" = "mainnet" ]; then
    export DEPLOYER_SECRET="${MAINNET_DEPLOYER_SECRET:-$DEFAULT_ACCOUNT}"
    export DEPLOYER_ADDRESS="${MAINNET_DEPLOYER_ADDRESS}"
else
    export DEPLOYER_SECRET="${TESTNET_DEPLOYER_SECRET:-$DEFAULT_ACCOUNT}"
    export DEPLOYER_ADDRESS="${TESTNET_DEPLOYER_ADDRESS}"
fi

# Validate required variables
if [ -z "$NETWORK_PASSPHRASE" ]; then
    echo "Error: NETWORK_PASSPHRASE not found in config"
    exit 1
fi

if [ -z "$RPC_URL" ]; then
    echo "Error: RPC_URL not found in config"
    exit 1
fi

# Display loaded configuration
echo "✅ Loaded configuration for: $NETWORK_NAME"
echo "   RPC URL: $RPC_URL"
echo "   Network: $NETWORK_PASSPHRASE"
echo "   Explorer: $EXPLORER_URL"
echo "   Account: $DEPLOYER_SECRET"