# Solana Forensic Analysis Tool

A comprehensive blockchain forensics and analytics platform designed for the Solana ecosystem. This tool helps investigators, researchers, and compliance teams analyze on-chain activities, track fund movements, and identify patterns in transaction flows.

## 🚀 Features

### 📊 Dashboard
- Real-time transaction monitoring
- Quick overview of wallet activities
- Transaction history with detailed information
- Status indicators for transaction confirmations

### 🔄 Transaction Flow Visualization
- Interactive graph visualization of fund movements
- Node-based representation of wallets and transactions
- Visual tracking of token transfers between addresses
- Customizable time range for analysis
- Zoom and pan capabilities for large transaction networks

### 👛 Wallet Analysis
- Detailed wallet activity metrics
- Token balance tracking and history
- Volume distribution analysis
- Transaction pattern identification
- Interactive charts and graphs for data visualization
- Unique interaction tracking

### 🏷️ Entity Labels
- Custom labeling system for addresses
- Known entity identification
- Confidence scoring for labels
- Bulk address labeling
- Label management interface
- Export and import label data

### 🔍 Transaction Clustering
- Advanced pattern recognition
- Group related transactions
- Identify common transaction patterns
- Time-based clustering analysis
- Volume-based relationship mapping

## 🛠️ Technical Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **Blockchain Integration**: Solana Web3.js
- **Data Visualization**: React Flow, Chart.js
- **API Integration**: Helius API

## 📋 Prerequisites

- Node.js (v16.x or later)
- npm (v7.x or later)
- A Helius API key ([Get one here](https://helius.dev))
- Basic understanding of Solana blockchain

## 🔧 Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/Ge0frey/solana-forensic-analysis-tool.git
cd solana-forensic-analysis-tool
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Create a \`.env\` file in the root directory:
\`\`\`env
VITE_HELIUS_API_KEY=your_api_key_here
VITE_SOLANA_NETWORK=devnet  # or mainnet-beta
\`\`\`

4. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

## 💻 Usage Guide

### Dashboard
1. Navigate to the dashboard
2. Enter a Solana wallet address in the search bar
3. View recent transactions and activity metrics

### Transaction Flow
1. Go to the Transaction Flow page
2. Enter a wallet address to analyze
3. Select the time range for analysis
4. Interact with the graph to explore connections
5. Use zoom and pan controls to navigate

### Wallet Analysis
1. Access the Wallet Analysis section
2. Input a wallet address
3. View detailed metrics and charts
4. Analyze token holdings and transaction patterns

### Entity Labels
1. Visit the Entity Labels page
2. Add addresses to label
3. Assign custom labels with confidence scores
4. Manage and update existing labels
5. Export label data as needed

### Transaction Clustering
1. Open the Transaction Clustering section
2. Enter a wallet address
3. Select clustering parameters
4. View grouped transactions and patterns
5. Analyze relationship maps

## 🔐 Security Considerations

- API keys should be kept secure and never committed to version control
- Use environment variables for sensitive configuration
- Regularly update dependencies for security patches
- Monitor API rate limits and usage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

## 📝 Development Guidelines

- Follow TypeScript best practices
- Use functional components with hooks
- Maintain consistent code formatting
- Write meaningful commit messages
- Add appropriate documentation
- Test thoroughly before submitting PRs

## 🐛 Known Issues

- Large transaction sets may impact visualization performance
- Some entity labels may have lower confidence scores
- API rate limiting on free tier accounts

## 📚 Additional Resources

- [Solana Documentation](https://docs.solana.com)
- [Helius API Documentation](https://docs.helius.xyz)
- [React Flow Documentation](https://reactflow.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Solana Foundation
- Helius
- The Solana developer community
- Contributors and testers

## 📧 Support

For support, please open an issue in the GitHub repository or contact the maintainers.
