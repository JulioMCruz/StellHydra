# StellHydra + 1inch Fusion Relayer

A production-ready relayer service for the StellHydra + 1inch Fusion cross-chain bridge system.

## Overview

The relayer is the core component that enables cross-chain communication between Stellar and Ethereum networks. It monitors blockchain events, processes bridge transactions, and coordinates atomic swaps with 1inch Fusion integration.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Stellar       │    │    Relayer      │    │   Ethereum      │
│   Monitor       │◄──►│    Service      │◄──►│   Monitor       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Bridge Processor │    │ Fusion Monitor  │    │ Escrow Processor│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Features

-   **Cross-Chain Monitoring**: Real-time monitoring of Stellar and Ethereum networks
-   **Bridge Processing**: Automated cross-chain bridge transaction processing
-   **Escrow Management**: HTLC-based atomic swap escrow processing
-   **Enhanced Fusion Integration**:
    -   1inch Fusion order monitoring and processing
    -   Auction Calculator integration for rate calculations
    -   WebSocket API for real-time order events
    -   Auction suffix and salt management
    -   Real-time order status tracking
-   **Health Monitoring**: Comprehensive health checks and performance metrics
-   **Error Handling**: Robust error handling and recovery mechanisms
-   **Logging**: Detailed logging with configurable levels
-   **Graceful Shutdown**: Proper shutdown handling and cleanup

## Quick Start

### 1. Environment Setup

Create a `.env` file in the project root:

```bash
# Environment
NODE_ENV=development

# Stellar Configuration
STELLAR_RPC_URL=https://horizon-testnet.stellar.org

# Ethereum Configuration
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
ADMIN_PRIVATE_KEY=your_admin_private_key_here

# Contract Addresses
BRIDGE_CONTRACT_ADDRESS=0x...
ESCROW_CONTRACT_ADDRESS=0x...

# Fusion Configuration (Optional)
FUSION_API_KEY=your_1inch_fusion_api_key
FUSION_API_URL=https://fusion.1inch.io

# Logging
LOG_LEVEL=info
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Relayer

#### Development Mode

```bash
npm run relayer:dev
```

#### Testnet Mode

```bash
npm run relayer:testnet
```

#### Production Mode

```bash
npm run relayer:prod
```

### 4. Check Health Status

```bash
npm run relayer:health
```

## Configuration

### Environment Variables

| Variable                  | Description                                  | Required | Default                 |
| ------------------------- | -------------------------------------------- | -------- | ----------------------- |
| `NODE_ENV`                | Environment (development/testnet/production) | Yes      | development             |
| `STELLAR_RPC_URL`         | Stellar RPC endpoint                         | Yes      | -                       |
| `ETHEREUM_RPC_URL`        | Ethereum RPC endpoint                        | Yes      | -                       |
| `ADMIN_PRIVATE_KEY`       | Admin private key for transactions           | Yes      | -                       |
| `BRIDGE_CONTRACT_ADDRESS` | Bridge contract address                      | Yes      | -                       |
| `ESCROW_CONTRACT_ADDRESS` | Escrow contract address                      | Yes      | -                       |
| `FUSION_API_KEY`          | 1inch Fusion API key                         | No       | -                       |
| `FUSION_API_URL`          | 1inch Fusion API URL                         | No       | https://fusion.1inch.io |
| `LOG_LEVEL`               | Logging level (debug/info/warn/error)        | No       | info                    |

### Environment-Specific Settings

#### Development

-   Polling interval: 10 seconds
-   Max retries: 2
-   Gas limit: 300,000

#### Testnet

-   Polling interval: 2 seconds
-   Max retries: 3
-   Gas limit: 400,000

#### Production

-   Polling interval: 3 seconds
-   Max retries: 5
-   Gas limit: 500,000

## Usage

### Starting the Relayer

```bash
# Development
npm run relayer:dev

# Testnet
npm run relayer:testnet

# Production
npm run relayer:prod
```

### Health Checks

```bash
# Check health status
npm run relayer:health

# Expected output:
{
  "isRunning": true,
  "stellarConnected": true,
  "ethereumConnected": true,
  "fusionConnected": true,
  "uptime": 3600000,
  "lastProcessedBlock": {
    "stellar": 123456,
    "ethereum": 789012
  },
  "pendingTransactions": {
    "bridges": 2,
    "escrows": 1,
    "fusion": 0
  },
  "performance": {
    "avgProcessingTime": 1500,
    "totalTransactions": 100,
    "successRate": 98.5
  }
}
```

### Manual Operations

The relayer supports manual operations for testing and debugging:

```typescript
// Process a specific bridge transaction
await relayer.processBridge("bridge_123");

// Process a specific escrow transaction
await relayer.processEscrow("escrow_456");

// Process a specific Fusion order
await relayer.processFusionOrder("order_789");
```

## Monitoring

### Health Monitoring

The relayer includes comprehensive health monitoring:

-   **Service Status**: Monitors connection to Stellar and Ethereum networks
-   **Performance Metrics**: Tracks processing times and success rates
-   **Error Tracking**: Records and reports errors
-   **Uptime Monitoring**: Tracks service uptime

### Logging

The relayer provides detailed logging with configurable levels:

```bash
# Debug level (most verbose)
LOG_LEVEL=debug npm run relayer:dev

# Info level (default)
LOG_LEVEL=info npm run relayer:dev

# Warn level (errors and warnings only)
LOG_LEVEL=warn npm run relayer:dev

# Error level (errors only)
LOG_LEVEL=error npm run relayer:dev
```

### Performance Metrics

The relayer tracks various performance metrics:

-   **Processing Time**: Average time to process transactions
-   **Success Rate**: Percentage of successful transactions
-   **Pending Transactions**: Number of transactions in queue
-   **Error Rate**: Number of errors per time period

## Error Handling

### Automatic Recovery

The relayer includes automatic recovery mechanisms:

-   **Connection Retry**: Automatically retries failed connections
-   **Transaction Retry**: Retries failed transactions with exponential backoff
-   **Error Logging**: Comprehensive error logging and reporting
-   **Graceful Degradation**: Continues operation even if some services fail

### Error Types

-   **Network Errors**: Connection issues with blockchain networks
-   **Transaction Errors**: Failed blockchain transactions
-   **Validation Errors**: Invalid transaction data
-   **Timeout Errors**: Transaction timeouts

## Security

### Private Key Management

-   **Environment Variables**: Store private keys in environment variables
-   **No Hardcoding**: Never hardcode private keys in code
-   **Access Control**: Restrict access to admin private keys

### Transaction Validation

-   **Input Validation**: Validate all transaction inputs
-   **Amount Validation**: Check transaction amounts
-   **Address Validation**: Validate blockchain addresses
-   **Gas Limit Validation**: Ensure appropriate gas limits

## Deployment

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "run", "relayer:prod"]
```

### Systemd Service

Create `/etc/systemd/system/stellhydra-relayer.service`:

```ini
[Unit]
Description=StellHydra Relayer Service
After=network.target

[Service]
Type=simple
User=stellhydra
WorkingDirectory=/opt/stellhydra-relayer
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run relayer:prod
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

## Troubleshooting

### Common Issues

#### Connection Issues

```bash
# Check network connectivity
curl -X GET https://horizon-testnet.stellar.org
curl -X POST https://sepolia.infura.io/v3/YOUR_KEY -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

#### Configuration Issues

```bash
# Validate configuration
npm run relayer:health
```

#### Performance Issues

```bash
# Check system resources
top
df -h
free -h
```

### Debug Mode

Enable debug mode for detailed logging:

```bash
LOG_LEVEL=debug npm run relayer:dev
```

### Manual Testing

Test individual components:

```bash
# Test Stellar connection
npm run test:stellar

# Test Ethereum connection
npm run test:ethereum

# Test Fusion API
npm run test:fusion
```

## Enhanced Fusion Integration

### Auction Calculator Integration

The relayer includes full integration with 1inch Fusion's Auction Calculator for advanced order processing:

```typescript
// Calculate auction rate for a specific timestamp
const rate = await fusionProcessor.calculateAuctionRate(orderHash, timestamp);

// Calculate auction taking amount
const auctionTakingAmount = await fusionProcessor.calculateAuctionTakingAmount(
	orderHash,
	rate
);

// Create auction calculator from limit order
const calculator = AuctionCalculator.fromLimitOrderV3Struct(limitOrderStruct);
const rateBump = calculator.calcRateBump(currentTime);
const auctionAmount = calculator.calcAuctionTakingAmount(
	takingAmount,
	rateBump
);
```

### WebSocket API Integration

Real-time order monitoring via WebSocket:

```typescript
// WebSocket automatically handles these events:
// - order_created
// - order_filled
// - order_cancelled
// - order_invalid
// - order_balance_change
// - order_allowance_change

// Get active orders
const activeOrders = await fusionProcessor.getActiveOrders();

// Ping WebSocket connection
const pong = await fusionProcessor.ping();
```

### Auction Suffix Management

```typescript
// Create auction suffix
const suffix = new AuctionSuffix({
	points: [{ coefficient: 20000, delay: 12 }],
	whitelist: [{ address: "0x...", allowance: 0 }],
});

const encodedSuffix = suffix.build();

// Decode auction suffix
const decodedSuffix = AuctionSuffix.decode(encodedSuffix);
```

### Example Usage

See `server/relayer/examples/fusion-integration-example.ts` for a complete example.

## API Reference

### RelayerService

Main relayer service class.

#### Methods

-   `start()`: Start the relayer service
-   `stop()`: Stop the relayer service
-   `getHealthStatus()`: Get health status
-   `processBridge(bridgeId)`: Process a specific bridge
-   `processEscrow(escrowId)`: Process a specific escrow
-   `processFusionOrder(orderHash)`: Process a specific Fusion order

### Monitors

#### StellarMonitor

Monitors Stellar network for bridge and escrow events.

#### EthereumMonitor

Monitors Ethereum network for bridge and escrow events.

#### FusionMonitor

Monitors 1inch Fusion for order events.

#### HealthMonitor

Monitors overall system health and performance.

### Processors

#### BridgeProcessor

Processes cross-chain bridge transactions.

#### EscrowProcessor

Processes HTLC-based escrow transactions.

#### FusionProcessor

Processes 1inch Fusion orders.

## Contributing

### Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Start development server: `npm run relayer:dev`

### Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
```

### Code Style

-   Use TypeScript for all new code
-   Follow ESLint configuration
-   Write comprehensive tests
-   Document all public APIs

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:

-   Create an issue on GitHub
-   Check the troubleshooting section
-   Review the logs for error details
-   Contact the development team
