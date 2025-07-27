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

### Project Structure
```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility libraries
│   │   └── pages/          # Application pages
├── server/                 # Backend Express application
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Data storage interface
│   └── vite.ts            # Vite integration
├── shared/                 # Shared types and schemas
└── components.json         # Shadcn/UI configuration
```

### Key Components

#### Bridge Interface
- Token selection and amount input
- Real-time price simulation
- Transaction execution

#### Price Comparison
- Multi-DEX price aggregation
- Best rate highlighting
- Real-time updates

#### Wallet Connection
- Multi-network wallet management
- Balance display
- Connection status

#### Transaction Status
- Real-time status tracking
- Transaction history
- Progress indicators

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

## 🌐 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
```env
DATABASE_URL=postgresql://user:password@localhost:5432/stellhydra
NODE_ENV=production
PORT=5000
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