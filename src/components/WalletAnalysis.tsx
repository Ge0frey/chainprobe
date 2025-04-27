import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { getEnhancedWalletActivity, fetchTokenBalances, fetchWalletTransactions } from '../services/solana';
import { Spinner } from './ui/Spinner';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { RiAlertLine, RiWalletLine } from 'react-icons/ri';
import { Player } from '@lottiefiles/react-lottie-player';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  TimeScale
);

export default function WalletAnalysis() {
  const [searchAddress, setSearchAddress] = useState('');
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);

  // Fetch enhanced wallet activity data
  const { 
    data: activity, 
    isLoading: activityLoading,
    error: activityError
  } = useQuery({
    queryKey: ['enhanced-wallet-activity', currentAddress],
    queryFn: () => currentAddress ? getEnhancedWalletActivity(currentAddress) : null,
    enabled: !!currentAddress,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000),
  });

  // Fetch token balances
  const {
    data: tokenBalances,
    isLoading: tokensLoading,
    error: tokensError
  } = useQuery({
    queryKey: ['token-balances', currentAddress],
    queryFn: () => currentAddress ? fetchTokenBalances(currentAddress) : null,
    enabled: !!currentAddress,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000),
  });

  // Fetch recent transactions
  const {
    data: transactions,
    isLoading: txLoading,
    error: txError
  } = useQuery({
    queryKey: ['recent-transactions', currentAddress],
    queryFn: () => currentAddress ? fetchWalletTransactions(currentAddress, 20) : null,
    enabled: !!currentAddress,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchAddress) {
      setCurrentAddress(searchAddress);
    }
  };

  // Prepare chart data
  const activityPatternsData = activity?.activityPatterns ? {
    labels: activity.activityPatterns.hourlyDistribution.map(h => `${h.hour}:00`),
    datasets: [
      {
        label: 'Transactions',
        data: activity.activityPatterns.hourlyDistribution.map(h => h.count),
        backgroundColor: 'rgba(153, 102, 255, 0.7)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  } : null;

  const isLoading = activityLoading || tokensLoading || txLoading;
  const error = activityError || tokensError || txError;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-solana-purple to-solana-teal bg-clip-text text-transparent">
            Wallet Analysis
          </h1>
          <p className="text-muted-foreground">
            Deep dive into wallet behavior and transaction patterns
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              placeholder="Enter wallet address to analyze"
              className="flex-1 glass-input"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-solana-purple to-solana-teal text-white rounded-lg font-semibold hover:shadow-glow transition-all"
            >
              Analyze
            </button>
          </div>
        </form>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <Spinner />
            <span className="ml-3 text-gray-600 dark:text-gray-400">Analyzing wallet activity...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-600 mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center gap-3"
          >
            <div className="bg-red-100 dark:bg-red-800/30 p-2 rounded-full">
              <RiAlertLine className="text-red-600 dark:text-red-400 text-xl" />
            </div>
            <div>
              <h3 className="font-medium text-red-800 dark:text-red-300">Error</h3>
              <p className="text-sm text-red-600 dark:text-red-400">
                {error instanceof Error ? error.message : 'An error occurred'}
              </p>
            </div>
          </motion.div>
        )}

        {/* Analysis Results */}
        {!isLoading && !error && activity && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Wallet Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-xl p-6"
            >
              <h2 className="text-lg font-semibold mb-4">Wallet Overview</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Transactions</span>
                  <span className="font-medium">{activity.totalTransactions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Volume (In/Out)</span>
                  <span className="font-medium">
                    {activity.volumeStats.incoming.toFixed(2)}/{activity.volumeStats.outgoing.toFixed(2)} SOL
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">First Activity</span>
                  <span className="font-medium">{format(activity.firstActive, 'PPp')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Last Activity</span>
                  <span className="font-medium">{format(activity.lastActive, 'PPp')}</span>
                </div>
              </div>
            </motion.div>

            {/* Activity Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-xl p-6"
            >
              <h2 className="text-lg font-semibold mb-4">Activity Over Time</h2>
              <div className="h-[300px]">
                {activityPatternsData ? (
                  <Bar
                    data={activityPatternsData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                        title: {
                          display: true,
                          text: 'Hourly Transaction Distribution'
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No activity data available
                  </div>
                )}
              </div>
            </motion.div>

            {/* Token Holdings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-xl p-6"
            >
              <h2 className="text-lg font-semibold mb-4">Token Holdings</h2>
              <div className="space-y-4">
                {tokenBalances && tokenBalances.length > 0 ? (
                  tokenBalances.map(token => (
                    <div key={token.mint} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {token.logo ? (
                          <img src={token.logo} alt={token.symbol || 'token'} className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-solana-purple/20 to-solana-teal/20 flex items-center justify-center">
                            <span className="text-xs font-medium">{token.symbol?.[0] || '?'}</span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{token.name || token.symbol || 'Unknown Token'}</p>
                          <p className="text-sm text-muted-foreground">{token.symbol || token.mint.slice(0, 8)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{token.uiAmount.toFixed(token.decimals || 2)}</p>
                        {token.value !== undefined && (
                          <p className="text-sm text-muted-foreground">${token.value.toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground">
                    No token holdings found
                  </div>
                )}
              </div>
            </motion.div>

            {/* Recent Transactions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-xl p-6"
            >
              <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
              <div className="space-y-4">
                {transactions && transactions.length > 0 ? (
                  transactions.map(tx => (
                    <div key={tx.signature} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{tx.type || 'Transfer'}</p>
                        <p className="text-sm text-muted-foreground">{format(new Date(tx.blockTime * 1000), 'PPp')}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${tx.amount && tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {tx.amount ? (tx.amount > 0 ? '+' : '') + tx.amount.toFixed(2) : '0.00'} {tx.tokenInfo?.symbol || 'SOL'}
                        </p>
                        <a
                          href={`https://solscan.io/tx/${tx.signature}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-solana-purple hover:text-solana-teal transition-colors"
                        >
                          View on Solscan
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground">
                    No recent transactions found
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && !activity && (
          <div className="text-center py-10">
            <div className="glass-panel rounded-xl p-8">
              <RiWalletLine className="text-solana-purple/50 text-6xl mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Enter a wallet address to view analysis</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 