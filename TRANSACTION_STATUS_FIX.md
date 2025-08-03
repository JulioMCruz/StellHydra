# Transaction Status Update Fix

## Problem

You're getting a 404 error when trying to update transaction status:

```
PATCH http://localhost:5000/api/transactions/stellhydra_1754222480834/status 404 (Not Found)
```

## Root Cause

The issue occurs because:

1. **Two different server implementations**:

    - API routes (Vercel serverless) with isolated storage
    - Express server with shared in-memory storage

2. **Transaction created in one storage, accessed in another**:

    - Transaction was created in API routes storage
    - Status update tries to access it in a different storage instance

3. **Serverless functions don't share memory**:
    - Each API route invocation gets its own storage instance
    - Transactions created in one request aren't available in another

## Solution

### Option 1: Use Express Server (Recommended)

1. **Start the Express server**:

    ```bash
    npm run dev
    ```

2. **Access the application** at `http://localhost:3001`

3. **The Express server** serves both frontend and API with shared storage

### Option 2: Configure Frontend for Express Server

If you want to keep using port 5000 but have the frontend use the Express server API:

1. **Create a `.env` file** in the `client` directory:

    ```env
    VITE_API_BASE_URL=http://localhost:3001
    ```

2. **Start the Express server**:

    ```bash
    npm run dev
    ```

3. **Access the frontend** at `http://localhost:5000` (if you have a separate frontend server)

### Option 3: Fix API Routes Storage

I've already updated the API routes storage to be more persistent, but serverless functions still have limitations.

## Verification

To verify the fix is working:

1. **Start the Express server**:

    ```bash
    npm run dev
    ```

2. **Test the API**:

    ```bash
    curl http://localhost:3001/api/dex-prices/XLM/ETH
    ```

3. **Create a transaction** and check if status updates work

## Environment Variables

Add these to your `.env` file in the project root:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001

# Fusion API Configuration
VITE_FUSION_API_KEY=your-1inch-api-key
VITE_FUSION_PLUS_API_KEY=your-1inch-plus-api-key

# Network Configuration
VITE_STELLAR_RPC_URL=https://horizon-testnet.stellar.org
VITE_ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY

# Contract Addresses
VITE_BRIDGE_CONTRACT_ADDRESS=your-bridge-contract-address
VITE_ESCROW_CONTRACT_ADDRESS=your-escrow-contract-address

# Database Configuration
VITE_DATABASE_URL=your-database-url

# Development Configuration
VITE_PORT=3001
VITE_LOG_LEVEL=info
```

## Expected Behavior

After implementing the fix:

1. **Transactions created** in the Express server will be accessible
2. **Status updates** will work correctly
3. **No more 404 errors** for transaction status updates
4. **Shared storage** across all API endpoints

## Troubleshooting

If you still get 404 errors:

1. **Check if Express server is running**:

    ```bash
    curl http://localhost:3001/api/dex-prices/XLM/ETH
    ```

2. **Verify transaction exists**:

    ```bash
    curl http://localhost:3001/api/transactions/YOUR_TRANSACTION_ID
    ```

3. **Check environment variables** are set correctly

4. **Restart the server** after making changes
