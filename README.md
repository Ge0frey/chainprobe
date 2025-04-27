# ChainProbe: Solana Forensic Analysis Tool

<div align="center">
  <img src="public/solanaLogoMark.svg" alt="ChainProbe Logo" width="120" />
  <h3>Advanced Blockchain Forensics Platform</h3>
</div>

ChainProbe is a comprehensive blockchain forensics and analytics platform designed for the Solana ecosystem. This tool helps investigators, researchers, compliance teams, and blockchain analysts to deeply analyze on-chain activities, track fund movements, detect suspicious patterns, and identify relationships in transaction flows with precision and clarity.

## 📊 Overview

ChainProbe provides a suite of powerful analytics tools that leverage the Solana blockchain's data to reveal insights that may not be apparent through conventional blockchain explorers. With a focus on investigative workflows, the platform enables users to:

- Track the complete journey of funds across multiple hops and addresses
- Identify patterns in transaction behaviors that may indicate suspicious activities
- Visualize complex transaction networks with interactive graph representations
- Label and categorize entities for more effective investigations
- Generate detailed reports on wallet activities and transaction histories

## 🚀 Features

### 📈 Dashboard
- Real-time network statistics showing Solana blockchain metrics
- Live transaction monitoring with automatic updates
- Comprehensive wallet activity overview with transaction history
- Detailed token balance tracking with price information
- Status indicators for transaction confirmations
- Visualizations of transaction patterns and distributions

### 🔄 Transaction Flow Visualization
- Interactive graph visualization of fund movements
- Node-based representation of wallets and transactions
- Visual tracking of token transfers between addresses
- Direction and value indicators for funds flow
- Highlight of significant transactions and patterns
- Customizable time range for analysis
- Zoom and pan capabilities for large transaction networks
- Path tracing for specific fund movements

### 👛 Wallet Analysis
- Advanced wallet profiling with behavioral metrics
- Detailed wallet activity metrics and scoring
- Historical activity patterns and timelines
- Token balance tracking and transaction history
- Volume distribution analysis with charts
- Transaction pattern identification and anomaly detection
- Interactive charts and graphs for data visualization
- Unique interaction tracking and relationship mapping
- Risk scoring based on transaction behaviors

### 🏷️ Entity Labels
- Custom labeling system for addresses with confidence ratings
- Known entity identification from established databases
- Confidence scoring for labels with evidence tracking
- Bulk address labeling for efficient categorization
- Label management interface with search and filter capabilities
- Export and import label data in various formats
- Propagation of labels through transaction networks
- Label sharing and collaborative investigations

### 🔍 Transaction Clustering
- Advanced pattern recognition with machine learning algorithms
- Group related transactions with adjustable parameters
- Identify common transaction patterns and typologies
- Time-based clustering analysis for temporal patterns
- Volume-based relationship mapping
- Circular transaction detection
- Layering and structuring pattern identification
- Visualization of cluster relationships

### 🔎 Pattern Analysis
- Detection of known financial crime patterns
- Wash trading identification
- Round number transaction highlighting
- Temporal anomaly detection
- Velocity analysis of fund movements
- Unusual activity flagging with configurable thresholds
- Risk assessment based on pattern combinations
- Historical pattern comparison

## 🛠️ Technical Stack

- **Frontend Framework**: React 18 with TypeScript 
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS with custom theme support
- **State Management**: React Query for efficient server state management
- **Blockchain Integration**: Solana Web3.js for direct blockchain interaction
- **Data Visualization**: React Flow for networks, Chart.js for analytics
- **API Integration**: 
  - Helius API for enhanced transaction data
  - Solana Beach API for network statistics
  - Jupiter API for token pricing data
  - Optional integrations with other data providers

## 📋 Prerequisites

- Node.js (v16.x or later)
- npm (v7.x or later) or yarn (v1.22.x or later)
- API keys:
  - Helius API key ([Get one here](https://helius.dev))
  - Solana Beach API key (optional, for enhanced network stats)
- Basic understanding of Solana blockchain concepts
- Git for cloning the repository

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/Ge0frey/chainprobe.git
cd chainprobe
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory with necessary API keys:
```env
# Required
VITE_HELIUS_API_KEY=your_helius_api_key_here
VITE_SOLANA_NETWORK=mainnet-beta  # options: mainnet-beta, testnet, devnet

# Optional - For enhanced features
VITE_SOLANA_BEACH_API_KEY=your_solana_beach_api_key_here
VITE_JUPITER_API_KEY=your_jupiter_api_key_here

# Feature flags
VITE_ENABLE_LIVE_UPDATES=true
VITE_DEFAULT_TXN_LIMIT=100
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Building for production:
```bash
npm run build
# or
yarn build
```

6. Preview the production build:
```bash
npm run preview
# or
yarn preview
```

## 🚀 Deployment

### Vercel/Netlify
The application is configured for easy deployment on platforms like Vercel or Netlify:

1. Connect your GitHub repository
2. Configure the build command as `npm run build` or `yarn build`
3. Set the publish directory to `dist`
4. Add the environment variables from your `.env` file

## 💻 Usage Guide

### Dashboard
1. Navigate to the dashboard
2. View the real-time Solana network statistics at the top
3. Enter a Solana wallet address in the search bar
4. Review recent transactions, with detailed breakdowns
5. Examine token balances and holdings
6. Click on transactions to see full details including token transfers
7. Use the external links to view transactions on block explorers

### Transaction Flow
1. Go to the Transaction Flow page
2. Enter a wallet address to analyze
3. Select the time range for analysis (1 day to 90 days)
4. Adjust depth settings to control how many hops to include
5. Use filters to focus on specific transaction types or token amounts
6. Interact with the graph to explore connections:
   - Zoom in/out for detail
   - Click nodes to highlight connected addresses
   - Hover over edges to see transaction details
7. Export visualizations as PNG or SVG for reports
8. Save investigation state for later analysis

### Wallet Analysis
1. Access the Wallet Analysis section
2. Input a wallet address
3. View comprehensive metrics:
   - Activity timeline
   - Transaction volume patterns
   - Counterparty relationships
   - Token portfolio changes
4. Examine behavior patterns and anomalies
5. Review historical address activity with time-series charts
6. Generate risk assessment based on activity patterns
7. Export data in CSV or JSON format for further analysis

### Entity Labels
1. Visit the Entity Labels page
2. Add addresses manually or import in bulk
3. Assign custom labels with confidence scores and evidence
4. Use suggested labels from integrated databases
5. Manage existing labels with the label browser
6. Search and filter labels by various criteria
7. Export label data in multiple formats
8. Activate label propagation to automatically apply labels to related addresses
9. Share labels with team members or export for compliance reports

### Transaction Clustering
1. Open the Transaction Clustering section
2. Enter a starting wallet address
3. Select clustering parameters:
   - Relationship depth
   - Time window
   - Value thresholds
   - Pattern types
4. View the generated clusters with relationship strengths
5. Interact with the cluster visualization to understand relationships
6. Drill down into specific clusters for detailed transaction views
7. Save clustering results for ongoing investigations
8. Export cluster data for integration with other tools

### Pattern Analysis
1. Navigate to the Pattern Analysis section
2. Enter an address or group of addresses
3. Select the types of patterns to search for
4. Configure sensitivity and threshold settings
5. Review detected patterns with confidence scores
6. Examine specific transactions that contribute to patterns
7. Generate risk reports based on pattern combinations
8. Export findings for compliance documentation

## 🔍 Advanced Features

### Custom Pattern Creation
Create your own pattern detection rules using the pattern editor:
1. Define pattern criteria (transaction types, values, timing)
2. Set detection thresholds and confidence levels
3. Test patterns against historical data
4. Save and apply patterns to investigations

### Batch Analysis
Process multiple addresses simultaneously:
1. Upload CSV file with addresses
2. Select analysis type and parameters
3. Process in parallel for efficient investigation
4. Export combined results

### API Integration
ChainProbe can be integrated with other tools via its REST API:
1. Enable the API server in settings
2. Use the provided API key for authentication
3. Make requests to available endpoints
4. Process results in external systems

## 🔐 Security Considerations

- API keys should be kept secure and never committed to version control
- Use environment variables for sensitive configuration
- Consider using a .env.local file for development (it's git-ignored by default)
- Regularly update dependencies for security patches
- Monitor API rate limits and usage
- Be aware that blockchain data is public but your investigations are private
- Use secure connections (HTTPS) when deploying the application
- Consider IP restriction for API keys when supported by providers

## 🛠️ Troubleshooting

### API Connection Issues
- Verify your API keys are correctly set in the .env file
- Check API provider status pages for service disruptions
- Ensure you're not exceeding rate limits
- Try using a VPN if geographical restrictions apply

### Performance Issues
- Large transaction sets can impact visualization performance
- Try limiting the time range or transaction count
- Increase browser memory limits for large datasets
- Consider using the batch processing feature for very large analyses
- Use Chrome or Firefox for optimal performance

### Data Discrepancies
- Different data providers may have slight variations in transaction data
- Confirmation status can affect transaction visibility
- Some complex transactions may not be fully decoded
- Token amounts may display differently based on decimals configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices with strong typing
- Use functional components with React hooks
- Maintain the existing code structure and naming conventions
- Use the provided styling system with Tailwind CSS
- Add unit tests for new functionality
- Document APIs and complex functions
- Optimize for performance, especially with large datasets
- Test thoroughly with various wallet types and transaction patterns

## 📚 Additional Resources

- [Solana Documentation](https://docs.solana.com)
- [Helius API Documentation](https://docs.helius.xyz)
- [Solana Beach API Documentation](https://docs.solanabeach.io)
- [React Flow Documentation](https://reactflow.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Blockchain Forensics Best Practices](https://www.chainalysis.com/blog/blockchain-forensics/)
- [Solana Transaction Structure Guide](https://solana.com/docs/core/transactions)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Solana Foundation for blockchain infrastructure
- Helius for enhanced transaction data API
- Solana Beach for network statistics
- The Solana developer community
- Contributors and testers
- Open source projects that make this tool possible

## 📧 Support

For support, please:
- Open an issue in the GitHub repository
---

<div align="center">
  <p>
    <strong>ChainProbe: Bringing clarity to blockchain investigations</strong>
  </p>
  <p>
    <small>© 2023 ChainProbe. All rights reserved.</small>
  </p>
</div>
