import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TransactionFlow from './components/TransactionFlow';
import WalletAnalysis from './components/WalletAnalysis';
import EntityLabels from './components/EntityLabels';
import TransactionClustering from './components/TransactionClustering';

// Initialize QueryClient for React Query
const queryClient = new QueryClient();

// You can use other clusters like 'testnet', 'devnet', or your own RPC endpoint
const endpoint = clusterApiUrl('mainnet-beta');

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={[]} autoConnect>
          <WalletModalProvider>
            <Router>
              <div className="min-h-screen bg-background">
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/transaction-flow" element={<TransactionFlow />} />
                    <Route path="/wallet-analysis" element={<WalletAnalysis />} />
                    <Route path="/entity-labels" element={<EntityLabels />} />
                    <Route path="/transaction-clustering" element={<TransactionClustering />} />
                  </Routes>
                </Layout>
              </div>
            </Router>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </QueryClientProvider>
  );
}

export default App;
