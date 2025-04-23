import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion } from 'framer-motion';

import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TransactionFlow from './components/TransactionFlow';
import WalletAnalysis from './components/WalletAnalysis';
import EntityLabels from './components/EntityLabels';
import TransactionClustering from './components/TransactionClustering';
import PatternAnalysis from './components/PatternAnalysis';

// Initialize QueryClient for React Query
const queryClient = new QueryClient();

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
              <div className="min-h-screen bg-background relative overflow-hidden">
                {/* Animated background elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {/* Purple orb */}
                  <motion.div 
                    className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full bg-solana-purple/5 dark:bg-solana-purple/10 blur-3xl"
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.1, 0.15, 0.1],
                    }}
                    transition={{
                      duration: 15,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  
                  {/* Teal orb */}
                  <motion.div 
                    className="absolute bottom-[-30%] left-[-20%] w-[80vw] h-[80vw] rounded-full bg-solana-teal/5 dark:bg-solana-teal/10 blur-3xl"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.1, 0.13, 0.1],
                    }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 2
                    }}
                  />
                  
                  {/* Floating particles */}
                  <div className="absolute inset-0">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className={`absolute w-1 h-1 rounded-full ${
                          i % 2 === 0 
                            ? 'bg-solana-purple/20 dark:bg-solana-purple/30' 
                            : 'bg-solana-teal/20 dark:bg-solana-teal/30'
                        }`}
                        style={{
                          top: `${10 + Math.random() * 80}%`,
                          left: `${Math.random() * 100}%`,
                        }}
                        animate={{
                          y: [0, -30, 0],
                          opacity: [0.3, 0.8, 0.3],
                        }}
                        transition={{
                          duration: 3 + Math.random() * 5,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: Math.random() * 5
                        }}
                      />
                    ))}
                  </div>
                </div>
                
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/transaction-flow" element={<TransactionFlow />} />
                    <Route path="/wallet-analysis" element={<WalletAnalysis />} />
                    <Route path="/entity-labels" element={<EntityLabels />} />
                    <Route path="/transaction-clustering" element={<TransactionClustering />} />
                    <Route path="/pattern-analysis" element={<PatternAnalysis />} />
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
