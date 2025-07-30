# StellHydra - Stellar to Sepolia ETH Bridge DEX Aggregator

A modern, full-stack cross-chain bridge application that enables seamless token transfers between the Stellar and Ethereum (Sepolia testnet) networks with real-time DEX price aggregation.

## 🌟 Features

- **Cross-Chain Bridge**: Seamlessly bridge tokens between Stellar and Sepolia networks
- **DEX Aggregation**: Real-time price comparison from multiple DEXs (StellarX, StellarTerm, Allbridge)
- **Dual Wallet Support**: Connect both Stellar (Freighter) and Ethereum (MetaMask) wallets
- **Real-time Updates**: Live transaction status tracking and balance updates
- **Modern UI**: Dark-themed interface with glass morphism design
- **Mobile Responsive**: Optimized for both desktop and mobile devices
- **Transaction History**: Complete transaction tracking with status updates

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Shadcn/UI** component library
- **TanStack Query** for state management
- **Wouter** for lightweight routing
- **Framer Motion** for animations

### Backend
- **Express.js** with TypeScript
- **Drizzle ORM** with PostgreSQL support
- **Zod** for schema validation
- **In-memory storage** (easily swappable with database)

### Blockchain Integration
- **Stellar SDK** for Stellar network interactions
- **Web3/Ethers** for Ethereum Sepolia testnet
- **Freighter Wallet** integration for Stellar
- **MetaMask** integration for Ethereum

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/JulioMCruz/StellHydra.git
   cd StellHydra
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Add your configuration
   DATABASE_URL=your_postgresql_url_here
   NODE_ENV=development
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## 🔧 Configuration

### Supported Networks
- **Stellar Mainnet** - For production use
- **Stellar Testnet** - For development/testing
- **Ethereum Sepolia** - Testnet for Ethereum integration

### Supported Wallets
- **Freighter** - Stellar wallet extension
- **MetaMask** - Ethereum wallet extension

## 📱 Usage

1. **Connect Wallets**: Click "Connect Wallet" to connect both Stellar and Sepolia wallets
2. **Select Tokens**: Choose source and destination tokens using the dropdown selectors
3. **Enter Amount**: Input the amount you want to bridge
4. **Review Quote**: Check the real-time price quote and fees
5. **Execute Bridge**: Click "Bridge Tokens" to initiate the cross-chain transaction
6. **Track Status**: Monitor your transaction progress in the activity panel

## 🏗️ Architecture

### System Architecture Overview

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[React UI Components]
        Hook[Custom Hooks]
        State[TanStack Query State]
    end
    
    subgraph "API Layer (Vercel Serverless)"
        API1[DEX Prices API]
        API2[Transactions API]
        API3[Bridge Simulation API]
        API4[Wallets API]
    end
    
    subgraph "Storage Layer"
        MEM[In-Memory Storage]
        DB[(Supabase PostgreSQL)]
    end
    
    subgraph "Blockchain Networks"
        STELLAR[Stellar Network]
        ETH[Ethereum Sepolia]
    end
    
    subgraph "External Services"
        SX[StellarX DEX]
        ST[StellarTerm DEX]
        AB[Allbridge DEX]
    end
    
    subgraph "Wallet Integrations"
        FW[Freighter Wallet]
        MM[MetaMask Wallet]
    end
    
    UI --> Hook
    Hook --> State
    State --> API1
    State --> API2
    State --> API3
    State --> API4
    
    API1 --> MEM
    API2 --> MEM
    API3 --> MEM
    API4 --> MEM
    
    MEM -.->|Optional| DB
    
    API1 --> SX
    API1 --> ST
    API1 --> AB
    
    UI --> FW
    UI --> MM
    
    FW --> STELLAR
    MM --> ETH
    
    classDef frontend fill:#e1f5fe
    classDef api fill:#f3e5f5
    classDef storage fill:#e8f5e8
    classDef blockchain fill:#fff3e0
    classDef external fill:#fce4ec
    
    class UI,Hook,State frontend
    class API1,API2,API3,API4 api
    class MEM,DB storage
    class STELLAR,ETH blockchain
    class SX,ST,AB,FW,MM external
```

### Component Architecture

```mermaid
graph TB
    subgraph "UI Components"
        Layout[Main Layout]
        Bridge[Bridge Interface]
        Price[Price Comparison]
        Wallet[Wallet Connection]
        Status[Transaction Status]
        Sidebar[Navigation Sidebar]
    end
    
    subgraph "Custom Hooks"
        useBridge[useBridge Hook]
        useWallet[useWallet Hook]
        useToast[useToast Hook]
        useMobile[useMobile Hook]
    end
    
    subgraph "Utility Libraries"
        Stellar[Stellar SDK Utils]
        Ethereum[Ethereum Utils]
        QueryClient[TanStack Query Client]
        Utils[Common Utils]
    end
    
    Layout --> Bridge
    Layout --> Sidebar
    Bridge --> Price
    Bridge --> Wallet
    Bridge --> Status
    
    Bridge --> useBridge
    Wallet --> useWallet
    Status --> useToast
    Layout --> useMobile
    
    useBridge --> Stellar
    useBridge --> Ethereum
    useBridge --> QueryClient
    useWallet --> Stellar
    useWallet --> Ethereum
    
    Stellar --> Utils
    Ethereum --> Utils
    
    classDef component fill:#e3f2fd
    classDef hook fill:#f1f8e9
    classDef util fill:#fff8e1
    
    class Layout,Bridge,Price,Wallet,Status,Sidebar component
    class useBridge,useWallet,useToast,useMobile hook
    class Stellar,Ethereum,QueryClient,Utils util
```

### Data Flow Architecture

```mermaid
graph LR
    subgraph CS ["Client State"]
        CompState[Component State]
        QueryCache[Query Cache]
        LocalStorage[Local Storage]
    end
    
    subgraph API ["API Endpoints"]
        DEX[DEX Prices API]
        TXN1[Create Transaction]
        TXN2[Get Transaction]
        TXN3[Get Wallet Transactions]
        TXN4[Update Status]
        SIM[Bridge Simulate]
        WAL1[Manage Wallets]
        WAL2[Update Balances]
    end
    
    subgraph EXT ["External Data Sources"]
        StellarX[StellarX DEX]
        StellarTerm[StellarTerm DEX]
        Allbridge[Allbridge DEX]
    end
    
    CompState --> QueryCache
    QueryCache --> DEX
    QueryCache --> TXN1
    QueryCache --> TXN2
    QueryCache --> TXN3
    QueryCache --> TXN4
    QueryCache --> SIM
    QueryCache --> WAL1
    QueryCache --> WAL2
    
    LocalStorage --> CompState
    
    StellarX --> DEX
    StellarTerm --> DEX
    Allbridge --> DEX
    
    classDef state fill:#e8eaf6
    classDef api fill:#f3e5f5
    classDef external fill:#e0f2f1
    
    class CompState,QueryCache,LocalStorage state
    class DEX,TXN1,TXN2,TXN3,TXN4,SIM,WAL1,WAL2 api
    class StellarX,StellarTerm,Allbridge external
```

### Project Structure
```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility libraries
│   │   └── pages/          # Application pages
├── api/                    # Vercel Serverless Functions
│   ├── _lib/              # Shared utilities
│   ├── dex-prices/        # DEX price endpoints
│   ├── transactions/      # Transaction endpoints
│   ├── bridge/            # Bridge simulation
│   └── wallets/           # Wallet management
├── server/                 # Legacy Express server (local dev)
├── shared/                 # Shared types and schemas
└── components.json         # Shadcn/UI configuration
```

## 🔗 API Endpoints

### DEX Prices
- `GET /api/dex-prices/:fromToken/:toToken` - Get current exchange rates

### Transactions
- `POST /api/transactions` - Create new bridge transaction
- `GET /api/transactions/:id` - Get transaction details
- `GET /api/transactions/wallet/:address` - Get wallet transactions
- `PATCH /api/transactions/:id/status` - Update transaction status

### Bridge Simulation
- `POST /api/bridge/simulate` - Simulate bridge transaction

### Wallets
- `POST /api/wallets` - Create or update wallet
- `PATCH /api/wallets/:address/:network/balances` - Update wallet balances

## 🔄 Sequence Diagrams

### Cross-Chain Bridge Transaction Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as React UI
    participant API as API Layer
    participant DEX as DEX Services
    participant Stellar as Stellar Network
    participant Ethereum as Ethereum Network
    participant FreighterWallet as Freighter Wallet
    participant MetaMask as MetaMask Wallet

    User->>UI: Select tokens & amount
    UI->>API: GET /api/dex-prices/XLM/ETH
    API->>DEX: Fetch rates from StellarX, StellarTerm, Allbridge
    DEX-->>API: Return exchange rates
    API-->>UI: Best rates & liquidity data
    UI-->>User: Display price comparison

    User->>UI: Click "Simulate Bridge"
    UI->>API: POST /api/bridge/simulate
    API->>API: Calculate fees, slippage, estimated time
    API-->>UI: Simulation results
    UI-->>User: Show bridge preview

    User->>UI: Click "Execute Bridge"
    UI->>FreighterWallet: Request connection
    FreighterWallet-->>UI: Connected (Stellar address)
    UI->>MetaMask: Request connection
    MetaMask-->>UI: Connected (Ethereum address)

    UI->>API: POST /api/transactions
    API->>API: Create transaction record
    API-->>UI: Transaction ID & details

    UI->>FreighterWallet: Request signature for Stellar transaction
    FreighterWallet->>User: Confirm transaction
    User-->>FreighterWallet: Approve
    FreighterWallet->>Stellar: Submit transaction
    Stellar-->>FreighterWallet: Transaction hash
    FreighterWallet-->>UI: Stellar tx hash

    UI->>API: PATCH /api/transactions/:id/status
    API->>API: Update status to "confirming"
    
    Note over Stellar: Transaction confirmation (~5 seconds)
    
    UI->>MetaMask: Request signature for Ethereum transaction
    MetaMask->>User: Confirm bridge completion
    User-->>MetaMask: Approve
    MetaMask->>Ethereum: Submit transaction
    Ethereum-->>MetaMask: Transaction hash
    MetaMask-->>UI: Ethereum tx hash

    UI->>API: PATCH /api/transactions/:id/status
    API->>API: Update status to "completed"
    API-->>UI: Final transaction status
    UI-->>User: Bridge completed successfully
```

### Wallet Connection & Balance Management Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as React UI
    participant WalletHook as useWallet Hook
    participant API as API Layer
    participant Freighter as Freighter Wallet
    participant MetaMask as MetaMask Wallet
    participant StellarNetwork as Stellar Network
    participant EthereumNetwork as Ethereum Network

    User->>UI: Click "Connect Wallet"
    UI->>WalletHook: initializeWallets()
    
    par Stellar Wallet Connection
        WalletHook->>Freighter: Check if installed
        Freighter-->>WalletHook: Available
        WalletHook->>Freighter: Request connection
        Freighter->>User: Show connection dialog
        User-->>Freighter: Approve connection
        Freighter-->>WalletHook: Return public key & network
        
        WalletHook->>API: POST /api/wallets
        API->>API: Store wallet info
        API-->>WalletHook: Wallet record created
        
        WalletHook->>StellarNetwork: Fetch account balances
        StellarNetwork-->>WalletHook: Account balances
        
        WalletHook->>API: PATCH /api/wallets/:address/stellar/balances
        API->>API: Update stored balances
        API-->>WalletHook: Balances updated
    and Ethereum Wallet Connection
        WalletHook->>MetaMask: Check if installed
        MetaMask-->>WalletHook: Available
        WalletHook->>MetaMask: Request connection
        MetaMask->>User: Show connection dialog
        User-->>MetaMask: Approve connection
        MetaMask-->>WalletHook: Return address & chain ID
        
        WalletHook->>API: POST /api/wallets
        API->>API: Store wallet info
        API-->>WalletHook: Wallet record created
        
        WalletHook->>EthereumNetwork: Fetch account balances
        EthereumNetwork-->>WalletHook: Account balances
        
        WalletHook->>API: PATCH /api/wallets/:address/sepolia/balances
        API->>API: Update stored balances
        API-->>WalletHook: Balances updated
    end

    WalletHook-->>UI: Wallets connected successfully
    UI-->>User: Show connected wallets & balances
    
    Note over UI: Auto-refresh balances every 30 seconds
    
    loop Balance Updates
        UI->>WalletHook: refreshBalances()
        WalletHook->>StellarNetwork: Fetch updated balances
        WalletHook->>EthereumNetwork: Fetch updated balances
        WalletHook->>API: Update stored balances
        WalletHook-->>UI: New balance data
        UI-->>User: Updated balance display
    end
```

### DEX Price Aggregation Flow

```mermaid
sequenceDiagram
    participant UI as React UI
    participant PriceHook as useBridge Hook
    participant API as API Layer
    participant Storage as Storage Layer
    participant StellarX
    participant StellarTerm
    participant Allbridge

    UI->>PriceHook: Select token pair (XLM/ETH)
    PriceHook->>API: GET /api/dex-prices/XLM/ETH
    
    API->>Storage: getDexPrices("XLM", "ETH")
    
    par Price Fetching (Simulated - would be real API calls)
        Storage->>StellarX: Fetch XLM/ETH rate
        StellarX-->>Storage: Rate: 0.0005291, Fee: 0.25%, Liquidity: 1M
    and
        Storage->>StellarTerm: Fetch XLM/ETH rate  
        StellarTerm-->>Storage: Rate: 0.0005284, Fee: 0.30%, Liquidity: 750K
    and
        Storage->>Allbridge: Fetch XLM/ETH rate
        Allbridge-->>Storage: Rate: 0.0005279, Fee: 0.35%, Liquidity: 500K
    end

    Storage->>Storage: Sort by best rate (highest)
    Storage-->>API: Sorted price data
    API-->>PriceHook: Price comparison results
    
    PriceHook->>PriceHook: Calculate best route
    PriceHook-->>UI: Display price comparison
    
    UI-->>User: Show rates with highlighting
    Note over UI: StellarX highlighted as best rate
    
    User->>UI: Enter amount (100 XLM)
    UI->>PriceHook: calculateOutput(100, rates)
    PriceHook->>PriceHook: Apply slippage & fees
    PriceHook-->>UI: Expected output (0.05291 ETH)
    UI-->>User: Show conversion preview
```

### Transaction Status Tracking Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as React UI
    participant StatusComponent as Transaction Status
    participant API as API Layer
    participant WebSocket as WebSocket (Future)
    participant BlockchainMonitor as Blockchain Monitor

    User->>UI: Execute bridge transaction
    UI->>API: POST /api/transactions
    API-->>UI: Transaction ID (tx_123)
    
    UI->>StatusComponent: Initialize tracking (tx_123)
    StatusComponent->>API: GET /api/transactions/tx_123
    API-->>StatusComponent: Status: "pending"
    StatusComponent-->>UI: Show "Pending" status
    
    Note over UI: User initiates blockchain transactions
    
    UI->>API: PATCH /api/transactions/tx_123/status
    Note over API: Status: "confirming", txHashFrom: "stellar_hash"
    API-->>StatusComponent: Updated status
    StatusComponent-->>UI: Show "Confirming on Stellar"
    
    loop Status Polling (every 5 seconds)
        StatusComponent->>API: GET /api/transactions/tx_123
        API-->>StatusComponent: Current status
        StatusComponent->>StatusComponent: Update progress bar
        StatusComponent-->>UI: Visual progress update
        UI-->>User: Real-time status display
    end
    
    Note over BlockchainMonitor: Stellar transaction confirmed
    
    UI->>API: PATCH /api/transactions/tx_123/status
    Note over API: Status: "bridging", txHashTo: "ethereum_hash"
    API-->>StatusComponent: Updated status
    StatusComponent-->>UI: Show "Processing on Ethereum"
    
    Note over BlockchainMonitor: Ethereum transaction confirmed
    
    UI->>API: PATCH /api/transactions/tx_123/status
    Note over API: Status: "completed"
    API-->>StatusComponent: Final status
    StatusComponent-->>UI: Show "Completed" with success animation
    UI-->>User: Bridge completed notification
    
    StatusComponent->>API: GET /api/transactions/wallet/:address
    API-->>StatusComponent: Updated transaction history
    StatusComponent-->>UI: Refresh transaction list
```

### Error Handling & Recovery Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as React UI
    participant ErrorBoundary as Error Boundary
    participant API as API Layer
    participant Wallet as Wallet Extension
    participant Network as Blockchain Network

    User->>UI: Attempt bridge transaction
    UI->>Wallet: Request transaction signature
    
    alt Wallet Error
        Wallet-->>UI: Error: User rejected
        UI->>ErrorBoundary: Handle wallet rejection
        ErrorBoundary-->>UI: Show user-friendly message
        UI-->>User: "Transaction cancelled by user"
    else Network Error
        UI->>API: POST /api/bridge/simulate
        API->>Network: Fetch network data
        Network-->>API: Network timeout
        API-->>UI: Error: Network unavailable
        UI->>ErrorBoundary: Handle network error
        ErrorBoundary-->>UI: Show retry option
        UI-->>User: "Network error - Click to retry"
        
        User->>UI: Click retry
        UI->>API: Retry simulation request
        API->>Network: Retry network call
        Network-->>API: Success response
        API-->>UI: Simulation results
        UI-->>User: Show successful results
    else API Error
        UI->>API: POST /api/transactions
        API-->>UI: Error: 500 Internal Server Error
        UI->>ErrorBoundary: Handle API error
        ErrorBoundary->>ErrorBoundary: Log error details
        ErrorBoundary-->>UI: Show fallback UI
        UI-->>User: "Service temporarily unavailable"
        
        Note over ErrorBoundary: Auto-retry after 5 seconds
        ErrorBoundary->>UI: Trigger retry
        UI->>API: Retry transaction creation
        API-->>UI: Success response
        UI-->>User: Transaction created successfully
    end
```

## 🌐 Deployment

### Development
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Deployment (Vercel)

#### 1. Build & Test Locally
```bash
npm run build
```

#### 2. Deploy to Vercel
```bash
# Connect to your GitHub repository
# Push changes to trigger automatic deployment
git add .
git commit -m "Deploy to Vercel"
git push origin main
```

#### 3. Environment Variables (Vercel Dashboard)
Set these environment variables in your Vercel project settings:

```env
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://ltqiiytotugzjnzwaoqh.supabase.co/
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SESSION_SECRET=your_secure_session_secret_here

# Optional: External APIs
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
SENTRY_DSN=your_sentry_dsn_here
ANALYTICS_API_KEY=your_analytics_key_here
```

### Deployment Architecture

```mermaid
graph TB
    subgraph VERCEL ["Vercel Deployment"]
        subgraph STATIC ["Static Assets"]
            HTML[index.html]
            CSS[CSS Bundle]
            JS[JavaScript Bundle]
        end
        
        subgraph FUNCTIONS ["Serverless Functions"]
            API1[DEX Prices API]
            API2[Transactions API]
            API3[Bridge API]
            API4[Wallets API]
        end
        
        subgraph EDGE ["Edge Network"]
            CDN[Global CDN]
            Cache[Edge Caching]
        end
    end
    
    subgraph EXTERNAL ["External Services"]
        Supabase[(Supabase DB)]
        StellarNet[Stellar Network]
        EthNet[Ethereum Network]
        DEXs[DEX APIs]
    end
    
    subgraph CLIENT ["Client"]
        Browser[User Browser]
        Freighter[Freighter Wallet]
        MetaMask[MetaMask Wallet]
    end
    
    Browser --> CDN
    CDN --> HTML
    CDN --> CSS
    CDN --> JS
    
    Browser --> API1
    Browser --> API2
    Browser --> API3
    Browser --> API4
    
    API1 --> Cache
    API2 --> Supabase
    API3 --> DEXs
    API4 --> Supabase
    
    Browser --> Freighter
    Browser --> MetaMask
    
    Freighter --> StellarNet
    MetaMask --> EthNet
    
    classDef vercel fill:#000,color:#fff
    classDef external fill:#e3f2fd
    classDef client fill:#f3e5f5
    
    class HTML,CSS,JS,API1,API2,API3,API4,CDN,Cache vercel
    class Supabase,StellarNet,EthNet,DEXs external
    class Browser,Freighter,MetaMask client
```

### Alternative Deployment Options

#### Traditional Server Deployment
```bash
# For VPS or traditional hosting
npm run build:server
npm start
```

#### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔐 Security

- All transactions require wallet signature confirmation
- No private keys are stored or transmitted
- Secure communication with blockchain networks
- Input validation on all API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Stellar Development Foundation](https://stellar.org/) for the Stellar blockchain
- [Ethereum Foundation](https://ethereum.org/) for Ethereum infrastructure
- [Allbridge](https://allbridge.io/) for cross-chain bridge inspiration
- [StellarX](https://www.stellarx.com/) and [StellarTerm](https://stellarterm.com/) for DEX integration

## 📞 Support

For support, email julio@stellhydra.com or create an issue in this repository.

---

**Built with ❤️ for the Stellar and Ethereum communities**