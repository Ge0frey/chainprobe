import { useState } from 'react';
import { motion } from 'framer-motion';
import { RiExchangeLine, RiAlertLine, RiTimeLine, RiArrowRightLine } from 'react-icons/ri';
import { Spinner } from './ui/Spinner';

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
  const [loading, setLoading] = useState(false);
  const [bridgeTransactions, setBridgeTransactions] = useState<BridgeTransaction[]>([]);
  const [alerts, setAlerts] = useState<BridgeAlert[]>([]);
  const [selectedTx, setSelectedTx] = useState<BridgeTransaction | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulated API call - replace with actual implementation
    setTimeout(() => {
      setBridgeTransactions([
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
      
      setAlerts([
        {
          type: 'Large Transfer',
          description: 'Unusually large amount bridged in a single transaction',
          severity: 'high',
          timestamp: '2024-03-15T10:30:00Z',
          relatedTxs: ['bridge_tx_1']
        },
      ]);
      
      setLoading(false);
    }, 1500);
  };

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
                <h2 className="text-xl font-semibold mb-4">Bridge Transactions</h2>
                <div className="space-y-4">
                  {bridgeTransactions.map((tx) => (
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

            {/* Alerts Panel */}
            <div className="lg:col-span-1">
              <div className="glass-panel p-6">
                <h2 className="text-xl font-semibold mb-4">Bridge Alerts</h2>
                <div className="space-y-4">
                  {alerts.map((alert, index) => (
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

              {selectedTx && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel p-6 mt-6"
                >
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
                        <RiAlertLine className="text-xl text-solana-teal" />
                        <span className="text-sm font-semibold">Risk Score</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-solana-purple to-solana-teal h-2 rounded-full"
                          style={{ width: `${selectedTx.riskScore * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground mt-1">
                        {(selectedTx.riskScore * 100).toFixed(0)}% Risk Level
                      </span>
                    </div>

                    <div className="glass-card p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <RiTimeLine className="text-xl text-solana-purple" />
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
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 