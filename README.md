# ChainProbe: Blockchain Forensic Analysis Tool

<div align="center">
  <img src="/public/solanaLogoMark.svg" alt="ChainProbe Logo" width="100" />
  <h3>Advanced Blockchain Forensic Analysis Platform for Solana</h3>
  <p>Investigate transactions, analyze wallet behavior, and detect suspicious patterns on the Solana blockchain</p>
</div>

## Overview

ChainProbe is a comprehensive blockchain forensic analysis tool built for the Solana ecosystem. It provides powerful features to track transaction flows, analyze wallet behavior, identify suspicious patterns, and perform security audits on tokens and smart contracts.

The platform serves as an essential toolkit for:
- Blockchain investigators tracking illicit funds
- Security researchers analyzing suspicious activity
- DeFi teams conducting due diligence
- Token projects verifying smart contract security
- Individual users checking wallet security and token safety

## Features

### Core Analysis Tools

- **Transaction Flow Visualization**: Interactive graph visualization of fund movements between wallets
- **Wallet Analysis**: Deep-dive into wallet behavior, transaction history, and risk assessment
- **Transaction Clustering**: Group related transactions to reveal hidden networks and connections
- **Pattern Analysis**: Detect suspicious patterns like wash trading, circular transactions, and anomalies
- **Entity Labels**: Identify and label known entities like exchanges, protocols, and suspicious actors

### Token Security

- **Token Analyzer**: Comprehensive risk assessment and analysis of token contracts
- **Trending Tokens**: Monitor and analyze popular tokens with risk scoring
- **New Tokens**: Track newly created tokens and assess their security risks
- **Verified Tokens**: Directory of verified secure tokens with reputation data

### Advanced Tools

- **Smart Contract Scanner**: Analyze smart contract code for vulnerabilities and security risks
- **Bridge Monitor**: Track cross-chain bridge transactions with risk assessment

## Technology Stack

- **Frontend**: React with TypeScript
- **State Management**: React Query for server state
- **Styling**: Tailwind CSS with custom theme
- **Visualization**: Force Graph, ChartJS, ReactFlow
- **APIs**: Helius (Solana), Webacy (risk assessment)
- **Authentication**: Solana wallet authentication

## Installation

### Prerequisites

- Node.js 16+
- npm or yarn

### Setup

1. Clone the repository
```bash
git clone https://github.com/ge0frey/chainprobe.git
cd chainprobe
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file in the root directory with the following variables:
```
# Helius API Configuration
VITE_HELIUS_API_KEY=your_helius_api_key
VITE_SOLANA_NETWORK=mainnet-beta

# DD.xyz API Key (Webacy)
VITE_DD_API_KEY=your_dd_api_key

# Dune API Key (optional)
VITE_DUNE_API_KEY=your_dune_api_key

# Feature Flags
VITE_ENABLE_LIVE_UPDATES=true
VITE_DEFAULT_TXN_LIMIT=100
```

4. Start the development server
```bash
npm run dev
```

## Usage Guide

### Transaction Flow Analysis

1. Navigate to the Transaction Flow page
2. Enter a wallet address to analyze
3. Explore the interactive graph showing fund movements
4. Click on nodes to see detailed transaction information
5. Use filters to focus on specific time periods or transaction types

### Wallet Analysis

1. Go to the Wallet Analysis page
2. Enter a wallet address to investigate
3. View comprehensive data including:
   - Transaction history
   - Balance history
   - Risk assessment
   - Connected entities
   - Activity patterns

### Token Security Analysis

1. Navigate to the Token Analyzer
2. Enter a token mint address
3. Review the comprehensive security analysis including:
   - Contract audit results
   - Risk factors
   - Liquidity assessment
   - Holder distribution
   - Rugpull indicators

## Key Components

### Dashboard

The Dashboard provides an overview of:
- Recent transactions
- Network statistics
- Trending tokens
- High-risk patterns
- Wallet activity summaries

### Transaction Clustering

The Transaction Clustering feature:
- Groups related transactions by patterns
- Identifies potential clusters of suspicious wallets
- Visualizes connections between different wallet clusters
- Assigns risk scores to clusters

### Pattern Analysis

The Pattern Analysis tool:
- Detects circular transaction patterns
- Identifies wash trading activity
- Spots abnormal transaction timings
- Finds unusual transaction amounts
- Analyzes temporal patterns in wallet activity

### Bridge Monitor

The Bridge Monitor:
- Tracks cross-chain bridge transactions
- Monitors for suspicious cross-chain activity
- Alerts on high-risk bridging patterns
- Verifies transaction completion across chains

## API Integration

ChainProbe integrates with several external APIs:

### Helius API
Used for Solana blockchain data access, transaction details, and enhanced transaction metadata.

### Webacy API
Provides risk assessment, sanction checking, and security analysis.

### Dune API (Optional)
Offers additional analytics and token balance information.

## Customization

### Theme
The application supports both light and dark modes, with a default preference for dark mode. Users can toggle between modes in the settings.

### Risk Assessment
The risk scoring algorithms can be customized by modifying the weighted parameters in the analysis modules.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [Solana](https://solana.com/)
- [Helius](https://helius.xyz/)
- [Webacy](https://webacy.com/)
- [Vite](https://vitejs.dev/)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)

---

<div align="center">
  <sub>Built with ❤️ for the Solana community</sub>
</div>
