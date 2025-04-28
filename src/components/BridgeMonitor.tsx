import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { RiExchangeLine, RiAlertLine, RiTimeLine, RiArrowRightLine, RiShieldLine } from 'react-icons/ri';
import { Spinner } from './ui/Spinner';
import { WebacyBranding } from './ui/WebacyBranding';
import { getComprehensiveRiskAnalysis } from '../services/webacy';

interface BridgeTransaction {
  id: string;
  sourceChain: string;
  destinationChain: string;
  sourceAddress: string;
  destinationAddress: string;
  amount: number;
  token: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  riskScore: number;
  bridgeProtocol: string;
}

interface BridgeAlert {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  relatedTxs: string[];
}

export default function BridgeMonitor() {
  const [searchAddress, setSearchAddress] = useState('');
  const [selectedTx, setSelectedTx] = useState<BridgeTransaction | null>(null);

  // Query for bridge transactions
  const {
    data: bridgeTransactions,
    isLoading: txLoading,
    error: txError
  } = useQuery({
    queryKey: ['bridge-transactions', searchAddress],
    queryFn: () => {
      // Simulated API call - replace with actual implementation
      return Promise.resolve([
        {
          id: 'bridge_tx_1',
          sourceChain: 'Solana',
          destinationChain: 'Ethereum',
          sourceAddress: '7YarqNvdS8JNVB9RZ76e1GXkZM5wRxgkjZNRxXfUk1Nb',
          destinationAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          amount: 1000,
          token: 'USDC',
          timestamp: '2024-03-15T10:30:00Z',
          status: 'completed',
          riskScore: 0.8,
          bridgeProtocol: 'Wormhole'
        },
      ]);
    },
    enabled: !!searchAddress
  });

  // Query for alerts
  const {
    data: alerts,
    isLoading: alertsLoading
  } = useQuery({
    queryKey: ['bridge-alerts', searchAddress],
    queryFn: () => {
      return Promise.resolve([
        {
          type: 'Large Transfer',
          description: 'Unusually large amount bridged in a single transaction',
          severity: 'high',
          timestamp: '2024-03-15T10:30:00Z',
          relatedTxs: ['bridge_tx_1']
        },
      ]);
    },
    enabled: !!searchAddress
  });

  // Query for Webacy risk analysis
  const {
    data: riskAnalysis,
    isLoading: riskLoading
  } = useQuery({
    queryKey: ['risk-analysis', selectedTx?.sourceAddress],
    queryFn: () => selectedTx ? getComprehensiveRiskAnalysis(selectedTx.sourceAddress) : null,
    enabled: !!selectedTx
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchAddress) {
      setSelectedTx(null);
    }
  };

  const loading = txLoading || alertsLoading || riskLoading;

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'low':
        return 'text-green-500';
      case 'medium':
        return 'text-yellow-500';
      case 'high':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusColor = (status: 'completed' | 'pending' | 'failed') => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'pending':
        return 'text-yellow-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-solana-purple to-solana-teal bg-clip-text text-transparent">
            Cross-Chain Bridge Monitor
          </h1>
          <p className="text-muted-foreground">
            Track and analyze cross-chain bridge transactions for suspicious activities
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              placeholder="Enter wallet address to monitor bridge activity"
              className="flex-1 glass-input"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-solana-purple to-solana-teal text-white rounded-lg font-semibold hover:shadow-glow transition-all"
            >
              Monitor Bridges
            </button>
          </div>
        </form>

        {/* Results Section */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bridge Transactions List */}
            <div className="lg:col-span-2">
              <div className="glass-panel p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Bridge Transactions</h2>
                  <WebacyBranding size="sm" />
                </div>
                <div className="space-y-4">
                  {bridgeTransactions?.map((tx) => (
                    <motion.div
                      key={tx.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedTx(tx)}
                      className={`p-4 rounded-lg cursor-pointer transition-all ${
                        selectedTx?.id === tx.id
                          ? 'bg-card/50 border border-solana-purple/50'
                          : 'bg-card/30 border border-border hover:border-solana-purple/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <RiExchangeLine className="text-xl text-solana-purple" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm">
                                {tx.sourceChain}
                              </span>
                              <RiArrowRightLine className="text-solana-teal" />
                              <span className="font-mono text-sm">
                                {tx.destinationChain}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {tx.amount} {tx.token}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-semibold ${getStatusColor(tx.status)}`}>
                            {tx.status.toUpperCase()}
                          </span>
                          <div className="text-xs text-muted-foreground">
                            {new Date(tx.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Alerts and Risk Analysis Panel */}
            <div className="lg:col-span-1">
              {selectedTx ? (
                <div className="space-y-6">
                  {/* Risk Analysis */}
                  <div className="glass-panel p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <RiShieldLine className="text-solana-purple" />
                        <span>Risk Assessment</span>
                      </h3>
                      <WebacyBranding size="sm" />
                    </div>

                    {/* Risk Score */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">Risk Score</span>
                        <span className={`font-medium ${
                          (riskAnalysis?.overallRiskScore ?? 0) > 0.7 ? 'text-red-500' : 
                          (riskAnalysis?.overallRiskScore ?? 0) > 0.3 ? 'text-yellow-500' : 
                          'text-green-500'
                        }`}>
                          {riskAnalysis ? `${(riskAnalysis.overallRiskScore * 100).toFixed(0)}%` : 'Analyzing...'}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all duration-300"
                          style={{ 
                            width: `${(riskAnalysis?.overallRiskScore || 0) * 100}%`,
                            background: `linear-gradient(90deg, rgb(20, 241, 149), rgb(255, 159, 28), rgb(239, 68, 68))`
                          }}
                        />
                      </div>
                    </div>

                    {/* Risk Factors */}
                    <div className="space-y-4">
                      {riskAnalysis?.threatRisks?.details?.map((detail, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`p-3 rounded-lg ${
                            detail.severity === 'high' ? 'bg-red-500/20' :
                            detail.severity === 'medium' ? 'bg-yellow-500/20' :
                            'bg-green-500/20'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <RiAlertLine className={
                              detail.severity === 'high' ? 'text-red-500' :
                              detail.severity === 'medium' ? 'text-yellow-500' :
                              'text-green-500'
                            } />
                            <span className="font-medium">{detail.category}</span>
                          </div>
                          <p className="text-sm text-gray-300">{detail.description}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Bridge Alerts */}
                  <div className="glass-panel p-6">
                    <h2 className="text-xl font-semibold mb-4">Bridge Alerts</h2>
                    <div className="space-y-4">
                      {alerts?.map((alert, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="glass-card p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <RiAlertLine className={`text-xl ${getSeverityColor(alert.severity)}`} />
                              <span className="font-semibold">{alert.type}</span>
                            </div>
                            <span className={`text-sm px-2 py-1 rounded-full ${getSeverityColor(alert.severity)} bg-opacity-20`}>
                              {alert.severity}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {alert.description}
                          </p>
                          <div className="text-xs text-muted-foreground">
                            {new Date(alert.timestamp).toLocaleString()}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div className="glass-panel p-6">
                    <h3 className="text-lg font-semibold mb-4">Transaction Details</h3>
                    <div className="space-y-4">
                      <div className="glass-card p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <RiExchangeLine className="text-xl text-solana-purple" />
                          <span className="text-sm font-semibold">Bridge Protocol</span>
                        </div>
                        <span className="text-lg">{selectedTx.bridgeProtocol}</span>
                      </div>

                      <div className="glass-card p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <RiTimeLine className="text-xl text-solana-teal" />
                          <span className="text-sm font-semibold">Addresses</span>
                        </div>
                        <div className="space-y-2">
                          <div className="text-xs">
                            <span className="text-muted-foreground">From:</span>
                            <div className="font-mono">{selectedTx.sourceAddress}</div>
                          </div>
                          <div className="text-xs">
                            <span className="text-muted-foreground">To:</span>
                            <div className="font-mono">{selectedTx.destinationAddress}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-panel p-6 flex items-center justify-center h-full">
                  <p className="text-muted-foreground">
                    Select a transaction to view details
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 