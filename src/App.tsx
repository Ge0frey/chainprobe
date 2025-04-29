import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion } from 'framer-motion';

import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import TransactionFlow from './components/TransactionFlow';
import WalletAnalysis from './components/WalletAnalysis';
import EntityLabels from './components/EntityLabels';
import TransactionClustering from './components/TransactionClustering';
import PatternAnalysis from './components/PatternAnalysis';
import SmartContractScanner from './components/SmartContractScanner';
import BridgeMonitor from './components/BridgeMonitor';
import RugCheck from './components/RugCheck';

// Initialize QueryClient for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

// You can use other clusters like 'testnet', 'devnet', or your own RPC endpoint
const endpoint = clusterApiUrl('mainnet-beta');

function App() {
  // Set dark mode by default
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={[]} autoConnect>
          <WalletModalProvider>
            <Router>
              <Routes>
                {/* Landing page route */}
                <Route path="/" element={<LandingPage />} />
                
                {/* Application routes wrapped in Layout */}
                <Route element={<Layout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/transaction-flow" element={<TransactionFlow />} />
                  <Route path="/wallet-analysis" element={<WalletAnalysis />} />
                  <Route path="/entity-labels" element={<EntityLabels />} />
                  <Route path="/transaction-clustering" element={<TransactionClustering />} />
                  <Route path="/pattern-analysis" element={<PatternAnalysis />} />
                  <Route path="/smart-contract-scanner" element={<SmartContractScanner />} />
                  <Route path="/bridge-monitor" element={<BridgeMonitor />} />
                  <Route path="/rug-check" element={<RugCheck />} />
                </Route>

                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </QueryClientProvider>
  );
}

export default App;
