#!/bin/bash

echo "🚀 Pushing StellHydra to GitHub..."

# Remove any git lock
rm -f .git/index.lock

# Add remote repository
git remote add origin https://github.com/JulioMCruz/StellHydra.git 2>/dev/null || echo "Remote already exists"

# Stage all files
git add .

# Commit with descriptive message
git commit -m "Initial commit: StellHydra - Stellar to Sepolia ETH bridge DEX aggregator

Features:
- Cross-chain bridge between Stellar and Ethereum Sepolia
- Real-time DEX price aggregation (StellarX, StellarTerm, Allbridge)  
- Dual wallet support (Freighter + MetaMask)
- Modern React UI with glass morphism design
- Transaction history and status tracking
- Mobile-responsive interface
- Express.js backend with RESTful API
- Complete documentation and setup instructions"

# Set main branch and push
git branch -M main
git push -u origin main

echo "✅ Successfully pushed to https://github.com/JulioMCruz/StellHydra"