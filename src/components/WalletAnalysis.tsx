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
import { getEnhancedWalletActivity, fetchWalletTransactions } from '../services/solana';
import { fetchDuneTokenBalances, DuneTokenBalance } from '../services/dune';
import { Spinner } from './ui/Spinner';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiAlertLine, 
  RiWalletLine, 
  RiArrowDownLine, 
  RiArrowUpLine, 
  RiExchangeLine,
  RiTimeLine,
  RiPieChartLine,
  RiBarChartLine,
  RiMoreLine,
  RiExternalLinkLine,
  RiRefreshLine
} from 'react-icons/ri';
import { getComprehensiveRiskAnalysis } from '../services/webacy';
import { RiskScoreCard } from './ui/RiskScoreCard';

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
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showAllTokens, setShowAllTokens] = useState(false);

  // Fetch enhanced wallet activity data
  const { 
    data: activity, 
    isLoading: activityLoading,
    error: activityError,
    refetch: refetchActivity
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
    error: tokensError,
    refetch: refetchTokens
  } = useQuery<DuneTokenBalance[]>({
    queryKey: ['dune-token-balances', currentAddress],
    queryFn: async () => {
      if (!currentAddress) return [];
      return await fetchDuneTokenBalances(currentAddress);
    },
    enabled: !!currentAddress,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000),
  });

  // Fetch recent transactions
  const {
    data: transactions,
    isLoading: txLoading,
    error: txError,
    refetch: refetchTransactions
  } = useQuery({
    queryKey: ['recent-transactions', currentAddress],
    queryFn: () => currentAddress ? fetchWalletTransactions(currentAddress, 50) : null,
    enabled: !!currentAddress,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000),
  });

  // Add new query for risk analysis
  const { 
    data: riskAnalysis, 
    isLoading: riskLoading,
    error: riskError 
  } = useQuery({
    queryKey: ['risk-analysis', currentAddress],
    queryFn: () => currentAddress ? getComprehensiveRiskAnalysis(currentAddress) : null,
    enabled: !!currentAddress,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchAddress) {
      setCurrentAddress(searchAddress);
      setShowAllTransactions(false);
      setShowAllTokens(false);
    }
  };

  const handleRefresh = () => {
    if (currentAddress) {
      refetchActivity();
      refetchTokens();
      refetchTransactions();
    }
  };

  // Calculate additional metrics
  const calculateMetrics = () => {
    if (!transactions) return null;

    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    const last7Days = now - (7 * 24 * 60 * 60 * 1000);

    return {
      last24h: {
        count: transactions.filter(tx => tx.blockTime * 1000 > last24Hours).length,
        volume: transactions
          .filter(tx => tx.blockTime * 1000 > last24Hours)
          .reduce((sum, tx) => sum + (tx.amount || 0), 0)
      },
      last7d: {
        count: transactions.filter(tx => tx.blockTime * 1000 > last7Days).length,
        volume: transactions
          .filter(tx => tx.blockTime * 1000 > last7Days)
          .reduce((sum, tx) => sum + (tx.amount || 0), 0)
      },
      avgTxValue: transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0) / transactions.length,
      incomingCount: transactions.filter(tx => tx.destination === currentAddress).length,
      outgoingCount: transactions.filter(tx => tx.source === currentAddress).length
    };
  };

  const metrics = calculateMetrics();

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

  const isLoading = activityLoading || tokensLoading || txLoading || riskLoading;
  const error = activityError || tokensError || txError || riskError;

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
          <div className="space-y-6">
            {/* Quick Stats */}
            {metrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel p-4 rounded-xl"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">24h Transactions</p>
                      <h3 className="text-2xl font-bold">{metrics.last24h.count}</h3>
                    </div>
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                      <RiBarChartLine className="text-xl text-purple-500" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Volume: {metrics.last24h.volume.toFixed(2)} SOL
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="glass-panel p-4 rounded-xl"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">7d Transactions</p>
                      <h3 className="text-2xl font-bold">{metrics.last7d.count}</h3>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                      <RiTimeLine className="text-xl text-blue-500" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Volume: {metrics.last7d.volume.toFixed(2)} SOL
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass-panel p-4 rounded-xl"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Avg Transaction</p>
                      <h3 className="text-2xl font-bold">{metrics.avgTxValue.toFixed(2)} SOL</h3>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                      <RiPieChartLine className="text-xl text-green-500" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Based on {transactions?.length || 0} transactions
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass-panel p-4 rounded-xl"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">In/Out Ratio</p>
                      <h3 className="text-2xl font-bold">
                        {metrics.incomingCount}/{metrics.outgoingCount}
                      </h3>
                    </div>
                    <div className="p-3 bg-teal-100 dark:bg-teal-900/20 rounded-full">
                      <RiExchangeLine className="text-xl text-teal-500" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {((metrics.incomingCount / (metrics.incomingCount + metrics.outgoingCount)) * 100).toFixed(1)}% incoming
                  </p>
                </motion.div>
              </div>
            )}

            {/* Risk Score Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Analysis Grid */}
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Wallet Overview */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel rounded-xl p-6"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold">Wallet Overview</h2>
                      <button
                        onClick={handleRefresh}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                      >
                        <RiRefreshLine className="text-gray-500" />
                      </button>
                    </div>
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
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold">Token Holdings</h2>
                      {tokenBalances && tokenBalances.length > 5 && (
                        <button
                          onClick={() => setShowAllTokens(!showAllTokens)}
                          className="text-sm text-solana-purple hover:text-solana-teal transition-colors"
                        >
                          {showAllTokens ? 'Show Less' : `Show All (${tokenBalances.length})`}
                        </button>
                      )}
                    </div>
                    <div className="space-y-4">
                      {tokenBalances && tokenBalances.length > 0 ? (
                        <>
                          {(showAllTokens ? tokenBalances : tokenBalances.slice(0, 5)).map(token => (
                            <motion.div
                              key={token.address}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="p-4 bg-card/30 rounded-lg hover:bg-card/50 transition-colors"
                            >
                              <div className="flex items-center gap-3 mb-2">
                                {token.token_metadata?.logo ? (
                                  <img src={token.token_metadata.logo} alt={token.symbol || 'token'} className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-solana-purple/20 to-solana-teal/20 flex items-center justify-center">
                                    <span className="text-xs font-medium">{token.symbol?.[0] || '?'}</span>
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium">{token.name || token.symbol || token.address.slice(0, 8)}</p>
                                  <p className="text-sm text-muted-foreground">{token.symbol}</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Amount</p>
                                  <p className="font-medium">{parseFloat(token.amount).toLocaleString(undefined, {
                                    maximumFractionDigits: token.decimals > 4 ? 4 : token.decimals
                                  })}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Value</p>
                                  <p className="font-medium">${token.value_usd?.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  }) || '0.00'}</p>
                                </div>
                                {token.price_usd && (
                                  <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Price</p>
                                    <p className="font-medium">${token.price_usd.toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 6
                                    })}</p>
                                  </div>
                                )}
                                {token.low_liquidity !== undefined && (
                                  <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Liquidity</p>
                                    <p className={`font-medium ${token.low_liquidity ? 'text-yellow-500' : 'text-green-500'}`}>
                                      {token.low_liquidity ? 'Low' : 'High'}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {token.token_metadata?.url && (
                                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                  <a 
                                    href={token.token_metadata.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-solana-purple hover:text-solana-teal transition-colors flex items-center gap-1"
                                  >
                                    <span>View Token Info</span>
                                    <RiExternalLinkLine />
                                  </a>
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </>
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
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold">Recent Transactions</h2>
                      {transactions && transactions.length > 5 && (
                        <button
                          onClick={() => setShowAllTransactions(!showAllTransactions)}
                          className="text-sm text-solana-purple hover:text-solana-teal transition-colors"
                        >
                          {showAllTransactions ? 'Show Less' : `Show All (${transactions.length})`}
                        </button>
                      )}
                    </div>
                    <div className="space-y-4">
                      {transactions && transactions.length > 0 ? (
                        <>
                          {(showAllTransactions ? transactions : transactions.slice(0, 5)).map(tx => (
                            <motion.div
                              key={tx.signature}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center justify-between p-3 bg-card/30 rounded-lg hover:bg-card/50 transition-colors"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{tx.type || 'Transfer'}</span>
                                  {tx.source === currentAddress ? (
                                    <RiArrowUpLine className="text-red-500" />
                                  ) : (
                                    <RiArrowDownLine className="text-green-500" />
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{format(new Date(tx.blockTime * 1000), 'PPp')}</p>
                              </div>
                              <div className="text-right">
                                <p className={`font-medium ${tx.amount && tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {tx.amount ? (tx.amount > 0 ? '+' : '') + tx.amount.toFixed(4) : '0.00'} {tx.tokenInfo?.symbol || 'SOL'}
                                </p>
                                <a
                                  href={`https://solscan.io/tx/${tx.signature}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-solana-purple hover:text-solana-teal transition-colors flex items-center gap-1 justify-end"
                                >
                                  View <RiExternalLinkLine />
                                </a>
                              </div>
                            </motion.div>
                          ))}
                        </>
                      ) : (
                        <div className="text-center text-muted-foreground">
                          No recent transactions found
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Risk Score Card */}
              <div className="lg:col-span-1">
                <RiskScoreCard
                  score={riskAnalysis?.overallRiskScore || 0}
                  loading={riskLoading}
                  details={riskAnalysis?.threatRisks?.details}
                />

                {riskAnalysis && !riskLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-6 space-y-4"
                  >
                    {riskAnalysis.sanctionChecks.isSanctioned && (
                      <div className="glass-panel p-4 border-2 border-red-500/50">
                        <div className="flex items-center gap-2 text-red-500">
                          <RiAlertLine className="text-xl" />
                          <span className="font-semibold">Sanctioned Address</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          This address has been identified in sanction lists.
                        </p>
                      </div>
                    )}

                    {riskAnalysis.approvalRisks.approvals.length > 0 && (
                      <div className="glass-panel p-4">
                        <h3 className="text-sm font-medium mb-3">Risky Approvals</h3>
                        <div className="space-y-2">
                          {riskAnalysis.approvalRisks.approvals.map((approval, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span className="font-mono">{approval.spender.slice(0, 8)}...</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${
                                approval.riskScore > 0.7 ? 'bg-red-500/20 text-red-500' :
                                approval.riskScore > 0.3 ? 'bg-yellow-500/20 text-yellow-500' :
                                'bg-green-500/20 text-green-500'
                              }`}>
                                {(approval.riskScore * 100).toFixed(0)}% Risk
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {riskAnalysis.exposureRisk.riskExposures.length > 0 && (
                      <div className="glass-panel p-4">
                        <h3 className="text-sm font-medium mb-3">Risk Exposures</h3>
                        <div className="space-y-2">
                          {riskAnalysis.exposureRisk.riskExposures.slice(0, 3).map((exposure, index) => (
                            <div key={index} className="text-sm">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-mono">{exposure.address.slice(0, 8)}...</span>
                                <span className={`text-xs ${
                                  exposure.riskScore > 0.7 ? 'text-red-500' :
                                  exposure.riskScore > 0.3 ? 'text-yellow-500' :
                                  'text-green-500'
                                }`}>
                                  {exposure.type}
                                </span>
                              </div>
                              <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                                <div 
                                  className="h-full rounded-full bg-gradient-to-r from-solana-purple to-solana-teal"
                                  style={{ width: `${exposure.riskScore * 100}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
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