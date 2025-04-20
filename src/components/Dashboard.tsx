import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchWalletTransactions, fetchTokenBalances, HeliusTransaction, fetchEnhancedTransaction, EnhancedTransaction } from '../services/solana';
import { Spinner } from './ui/Spinner';
import { 
  RiFlowChart, 
  RiWalletLine, 
  RiUserSearchLine, 
  RiGroupLine,
  RiSearchLine,
  RiExternalLinkLine,
  RiArrowRightLine,
  RiAlertLine,
} from 'react-icons/ri';
import { Player } from '@lottiefiles/react-lottie-player';
import { FeaturesSection } from './ui/FeaturesSection';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

export default function Dashboard() {
  const [searchInput, setSearchInput] = useState('');
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);

  // Fetch wallet transactions
  const { 
    data: transactions, 
    isLoading: txLoading, 
    error: txError 
  } = useQuery<HeliusTransaction[]>({
    queryKey: ['transactions', currentAddress],
    queryFn: async () => {
      if (!currentAddress) throw new Error('No address provided');
      try {
        return await fetchWalletTransactions(currentAddress, 20);
      } catch (e) {
        throw new Error('Invalid Solana address format');
      }
    },
    enabled: !!currentAddress,
    retry: false,
  });

  // Fetch token balances
  const { 
    data: tokenBalances, 
    isLoading: balancesLoading 
  } = useQuery({
    queryKey: ['token-balances', currentAddress],
    queryFn: () => currentAddress ? fetchTokenBalances(currentAddress) : null,
    enabled: !!currentAddress,
  });

  // Fetch transaction details when selected
  const { 
    data: transactionDetails, 
    isLoading: detailsLoading 
  } = useQuery<EnhancedTransaction | null>({
    queryKey: ['transaction-details', selectedTransaction],
    queryFn: () => selectedTransaction ? fetchEnhancedTransaction(selectedTransaction) : null,
    enabled: !!selectedTransaction,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput) {
      setCurrentAddress(searchInput);
      setSelectedTransaction(null); // Reset selected transaction
    }
  };

  const handleTransactionClick = (signature: string) => {
    setSelectedTransaction(signature);
  };

  // Format SOL amount
  const formatSol = (lamports: number) => {
    return (lamports / 1e9).toFixed(6);
  };

  // Get transaction type badge color
  const getTypeBadgeColor = (txType: string) => {
    switch (txType.toUpperCase()) {
      case 'TRANSFER':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-300';
      case 'SWAP':
      case 'SWAP_EXACT_IN':
      case 'SWAP_EXACT_OUT':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-800/30 dark:text-purple-300';
      case 'NFT_SALE':
      case 'NFT_LISTING':
      case 'NFT_CANCEL_LISTING':
      case 'NFT_MINT':
        return 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300';
      case 'UNKNOWN':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300';
      default:
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800/30 dark:text-indigo-300';
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="gradient-text text-3xl font-bold">Solana Forensic Analysis</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Analyze transactions, entities and wallet patterns on Solana
          </p>
        </div>
        
        {currentAddress && (
          <div className="bg-white/50 dark:bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-sm flex items-center gap-2">
            <span className="text-gray-500 dark:text-gray-400">Analyzing:</span>
            <span className="font-mono text-gray-800 dark:text-gray-200">{currentAddress.slice(0, 6)}...{currentAddress.slice(-6)}</span>
          </div>
        )}
      </div>
      
      {/* Search form */}
      <div className="glass-panel p-6 mb-6">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <RiSearchLine className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter Solana wallet address"
              className="block w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm focus:ring-2 focus:ring-solana-purple/50 dark:focus:ring-solana-teal/50 focus:border-transparent dark:text-white"
            />
          </div>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-5 py-2 bg-gradient-solana text-white rounded-lg shadow-glow-purple flex items-center justify-center gap-2"
          >
            <span>Analyze</span>
            <RiArrowRightLine />
          </motion.button>
        </form>
      </div>

      {/* Loading state */}
      {(txLoading || balancesLoading) && (
        <div className="flex justify-center items-center py-20">
          <Spinner />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Fetching data...</span>
        </div>
      )}

      {/* Empty state animation */}
      {!currentAddress && !txLoading && (
        <div className="text-center py-10">
          <div className="mx-auto w-64 h-64">
            <Player
              autoplay
              loop
              src="https://lottie.host/2e0c0f0a-6c69-4b09-a4a6-c2a0c3b4c34f/b9mOGnClNj.json"
            />
          </div>
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
            Enter a Solana wallet address to begin your analysis
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Search for any wallet to reveal transaction patterns and connections
          </p>
          
          {/* Add features section */}
          <FeaturesSection />
        </div>
      )}

      {/* Error state */}
      {txError && (
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
              {txError instanceof Error ? txError.message : 'An error occurred'}
            </p>
          </div>
        </motion.div>
      )}

      {/* Results display */}
      {currentAddress && !txLoading && !txError && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transactions */}
          <div className="lg:col-span-2">
            {transactions && transactions.length > 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-panel overflow-hidden rounded-xl"
              >
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Signature</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fee (SOL)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700/70">
                      {transactions.map((tx: HeliusTransaction) => (
                        <motion.tr 
                          key={tx.signature} 
                          className={`cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/50 ${selectedTransaction === tx.signature ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                          onClick={() => handleTransactionClick(tx.signature)}
                          whileHover={{ backgroundColor: 'rgba(243, 244, 246, 0.7)', scale: 1.005 }}
                          transition={{ duration: 0.2 }}
                        >
                          <td className="px-4 py-3 font-mono text-xs flex items-center">
                            <span className="truncate max-w-[100px]">
                              {tx.signature.slice(0, 8)}...{tx.signature.slice(-8)}
                            </span>
                            <a 
                              href={`https://solscan.io/tx/${tx.signature}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="ml-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                              <RiExternalLinkLine />
                            </a>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeColor(tx.type)}`}>
                              {tx.type || 'UNKNOWN'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {new Date(tx.blockTime * 1000).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                            {tx.amount ? `${tx.amount} ${tx.tokenInfo?.symbol || 'SOL'}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {formatSol(tx.fee)}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ) : currentAddress && !txLoading ? (
              <div className="glass-panel text-center p-6 rounded-xl">
                <div className="w-32 h-32 mx-auto">
                  <Player
                    autoplay
                    loop
                    src="https://lottie.host/1b6611dd-9482-489e-8511-ac74fab3bf5a/0r0MBEZLw3.json"
                  />
                </div>
                <p className="text-gray-600 dark:text-gray-400">No transactions found for this address</p>
              </div>
            ) : null}
          </div>

          {/* Sidebar with token balances and transaction details */}
          <div className="space-y-6">
            {/* Token Balances */}
            {tokenBalances && tokenBalances.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-panel overflow-hidden rounded-xl"
              >
                <div className="p-4 border-b border-gray-200/70 dark:border-gray-700/70">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Token Holdings</h2>
                </div>
                <div className="p-4">
                  <ul className="divide-y divide-gray-200/70 dark:divide-gray-700/70">
                    {tokenBalances.map((token) => (
                      <motion.li 
                        key={token.mint} 
                        className="py-3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * tokenBalances.indexOf(token) }}
                      >
                        <div className="flex items-center space-x-3">
                          {token.logo ? (
                            <div className="flex-shrink-0 h-8 w-8 p-1 bg-white dark:bg-gray-700 rounded-full shadow-sm">
                              <img 
                                src={token.logo} 
                                alt={token.symbol || 'token'} 
                                className="h-full w-full rounded-full"
                                onError={(e) => {
                                  // Handle image load errors
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600"></div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {token.symbol || token.mint.slice(0, 8)}...
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {token.uiAmount}
                            </p>
                          </div>
                          {token.value !== undefined && (
                            <div className="inline-flex items-center text-sm font-medium text-gray-900 dark:text-white">
                              ${token.value.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

            {/* Transaction Details */}
            {selectedTransaction && (detailsLoading ? (
              <div className="text-center glass-panel p-6 rounded-xl">
                <Spinner />
              </div>
            ) : transactionDetails ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel overflow-hidden rounded-xl"
              >
                <div className="p-4 border-b border-gray-200/70 dark:border-gray-700/70">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Transaction Details</h2>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</h3>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{transactionDetails.type}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{transactionDetails.description}</p>
                  </div>
                  
                  {transactionDetails.nativeTransfers && transactionDetails.nativeTransfers.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">SOL Transfers</h3>
                      <div className="mt-1 rounded-md border border-gray-200/70 dark:border-gray-700/70 overflow-hidden bg-white/50 dark:bg-gray-800/50">
                        <table className="min-w-full divide-y divide-gray-200/70 dark:divide-gray-700/70">
                          <thead className="bg-gray-50/70 dark:bg-gray-800/70">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">From</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">To</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200/70 dark:divide-gray-700/70">
                            {transactionDetails.nativeTransfers.map((transfer, idx) => (
                              <tr key={idx}>
                                <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 font-mono">
                                  {transfer.fromUserAccount.slice(0, 6)}...{transfer.fromUserAccount.slice(-6)}
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 font-mono">
                                  {transfer.toUserAccount.slice(0, 6)}...{transfer.toUserAccount.slice(-6)}
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-900 dark:text-white">
                                  {formatSol(transfer.amount)} SOL
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {transactionDetails.tokenTransfers && transactionDetails.tokenTransfers.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Token Transfers</h3>
                      <div className="mt-1 rounded-md border border-gray-200/70 dark:border-gray-700/70 overflow-hidden bg-white/50 dark:bg-gray-800/50">
                        <table className="min-w-full divide-y divide-gray-200/70 dark:divide-gray-700/70">
                          <thead className="bg-gray-50/70 dark:bg-gray-800/70">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">From</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">To</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Amount</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Token</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200/70 dark:divide-gray-700/70">
                            {transactionDetails.tokenTransfers.map((transfer, idx) => (
                              <tr key={idx}>
                                <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 font-mono">
                                  {transfer.fromUserAccount.slice(0, 6)}...{transfer.fromUserAccount.slice(-6)}
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 font-mono">
                                  {transfer.toUserAccount.slice(0, 6)}...{transfer.toUserAccount.slice(-6)}
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-900 dark:text-white">
                                  {transfer.tokenAmount}
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                                  {transfer.mint.slice(0, 6)}...
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                <a 
                  href={`https://solscan.io/tx/${selectedTransaction}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-3 border-t border-gray-200/70 dark:border-gray-700/70 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50/70 dark:hover:bg-gray-800/70 transition-colors"
                >
                  <span>View on Solscan</span>
                  <RiExternalLinkLine />
                </a>
              </motion.div>
            ) : (
              <div className="text-center glass-panel p-6 rounded-xl">
                <p className="text-gray-500 dark:text-gray-400">No transaction details available</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 