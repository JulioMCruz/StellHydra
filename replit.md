# StellarBridge - Cross-Chain DeFi Bridge

## Overview

StellHydra is a full-stack web application that enables users to bridge cryptocurrencies between the Stellar and Ethereum (Sepolia testnet) networks. The application provides real-time DEX price comparisons, wallet integration, and transaction management with a modern, responsive UI built using React and Express.

**Repository**: https://github.com/JulioMCruz/StellHydra

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a modern full-stack architecture with clear separation between frontend and backend concerns:

- **Frontend**: React SPA with TypeScript, built using Vite
- **Backend**: Express.js REST API with TypeScript
- **Database**: PostgreSQL with Drizzle ORM (configured but using in-memory storage currently)
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state, React hooks for local state

## Key Components

### Frontend Architecture
- **Component Library**: Uses shadcn/ui components built on Radix UI primitives
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with custom DeFi-themed color palette (stellar blue, ethereum purple)
- **State Management**: TanStack Query for API calls and caching
- **Wallet Integration**: Custom hooks for Stellar (Freighter) and Ethereum (MetaMask) wallet connections

### Backend Architecture
- **API Structure**: RESTful endpoints for transactions, DEX prices, and wallet management
- **Data Layer**: Abstract storage interface with current in-memory implementation
- **Middleware**: Express middleware for request logging and error handling
- **Development**: Vite integration for hot reloading in development

### Database Schema
The application uses Drizzle ORM with three main tables:
- **transactions**: Bridge transaction records with status tracking
- **dex_prices**: Real-time DEX price data from multiple sources
- **wallets**: Wallet connection and balance information

## Data Flow

1. **Wallet Connection**: Users connect Stellar (Freighter) and/or Ethereum (MetaMask) wallets
2. **Price Discovery**: Frontend fetches real-time prices from multiple DEX sources
3. **Transaction Simulation**: Bridge parameters are validated and simulated before execution
4. **Transaction Execution**: Bridge transactions are created and tracked through completion
5. **Status Updates**: Real-time transaction status updates via polling

## External Dependencies

### Frontend Dependencies
- **UI Framework**: React 18 with TypeScript
- **Component Library**: Radix UI primitives with shadcn/ui wrapper components
- **Styling**: Tailwind CSS with PostCSS
- **State Management**: TanStack Query for server state
- **Wallet SDKs**: Freighter for Stellar, MetaMask for Ethereum
- **Date Handling**: date-fns for date formatting
- **Form Handling**: React Hook Form with Zod validation

### Backend Dependencies
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod for schema validation
- **Session Management**: PostgreSQL session store
- **Development**: tsx for TypeScript execution, esbuild for production builds

### Development Tools
- **Build Tool**: Vite for frontend bundling and dev server
- **Type Checking**: TypeScript with strict configuration
- **Database Management**: Drizzle Kit for migrations and schema management
- **Replit Integration**: Custom Vite plugins for Replit development environment

## Deployment Strategy

The application is designed for deployment on Replit with the following setup:

### Development Environment
- **Frontend**: Vite dev server with HMR
- **Backend**: Express server with TypeScript execution via tsx
- **Database**: PostgreSQL instance (configured via DATABASE_URL)
- **Environment**: Replit-specific plugins and configuration

### Production Build
- **Frontend**: Static assets built to `dist/public`
- **Backend**: Compiled JavaScript bundle via esbuild
- **Database**: Production PostgreSQL with connection pooling
- **Deployment**: Single Node.js process serving both API and static files

### Key Architectural Decisions

1. **Monorepo Structure**: Shared types and schemas between frontend and backend for type safety
2. **In-Memory Storage**: Currently using memory storage for development; easily swappable with database implementation
3. **Wallet Abstraction**: Service layer abstracts wallet implementations for easy testing and extension
4. **Component System**: Comprehensive UI component library based on design system principles
5. **Type Safety**: End-to-end TypeScript with shared schemas using Zod
6. **Real-time Updates**: Polling-based updates for transaction status and price feeds
7. **Responsive Design**: Mobile-first design with glass-morphism aesthetic for modern DeFi feel

The architecture supports easy scaling and maintenance while providing a robust foundation for cross-chain bridging functionality.