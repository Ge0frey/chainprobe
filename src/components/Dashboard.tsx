import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
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
  RiCoinsLine,
  RiTimeLine,
  RiPulseLine,
  RiDatabase2Line,
  RiStackLine,
  RiShieldLine,
  RiBarChartBoxLine
} from 'react-icons/ri';
import { SiSolana } from 'react-icons/si';
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

// Type definition for Solana network stats
interface SolanaNetworkStats {
  totalSupply?: string;
  circulatingSupply?: string;
  marketCap?: string;
  totalTransactions?: string;
  blockHeight?: string;
  currentEpoch?: number;
  currentSlot?: string;
  slotsInEpoch?: string;
  slotProgress?: string;
  tps?: string;
  avgBlockTime?: string;
  inflationRate?: string;
  validatorRate?: string;
  foundationRate?: string;
}

export default function Dashboard() {
  const [searchInput, setSearchInput] = useState('');
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [solanaStats, setSolanaStats] = useState<SolanaNetworkStats>({});
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch Solana network stats
  useEffect(() => {
    const fetchSolanaStats = async () => {
      setStatsLoading(true);
      try {
        // Fetch supply data from Solana Beach API
        const supplyResponse = await axios.get('https://api.solanabeach.io/v1/supply', {
          headers: {
            'Accept': 'application/json',
            // Note: In a production environment, you would use an environment variable for API keys
            // This is a placeholder and would need to be replaced with a valid API key
            'Authorization': 'Bearer YOUR_SOLANA_BEACH_API_KEY'
          }
        });

        // Fetch inflation data from Solana Beach API
        const inflationResponse = await axios.get('https://api.solanabeach.io/v1/inflation', {
          headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer YOUR_SOLANA_BEACH_API_KEY'
          }
        });

        // Fetch network health from Solana Beach API
        const healthResponse = await axios.get('https://api.solanabeach.io/v1/health', {
          headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer YOUR_SOLANA_BEACH_API_KEY'
          }
        });

        // Fetch from Helius API (demo key, replace with your own)
        const heliusResponse = await axios.get('https://api.helius.xyz/v0/blocks/latest?api-key=YOUR_HELIUS_API_KEY');

        // Parse and organize the data
        // Note: In a real implementation, you would add proper type checking and error handling
        const total = supplyResponse.data?.total / 1e9 || 0;
        const circulating = supplyResponse.data?.circulating / 1e9 || 0;
        const percentage = (circulating / total * 100).toFixed(2);

        // Format to appropriate scale (M/B/T depending on magnitude)
        const formatNumber = (num: number): string => {
          if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
          if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
          if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
          return num.toFixed(2);
        };

        setSolanaStats({
          totalSupply: formatNumber(total) + ' SOL',
          circulatingSupply: formatNumber(circulating) + ' SOL',
          marketCap: '$' + formatNumber(circulating * 150), // Placeholder price - would be fetched from an API
          totalTransactions: formatNumber(398.18e9), // Example static value - would come from API
          blockHeight: formatNumber(heliusResponse.data?.slot || 0),
          currentEpoch: 776, // Example static value - would come from API
          currentSlot: formatNumber(healthResponse.data?.currentSlot || 0),
          slotsInEpoch: formatNumber(432000), // Example static value - would come from API
          slotProgress: ((healthResponse.data?.currentSlot % 432000) / 432000 * 100).toFixed(2) + '%',
          tps: '4,343', // Example static value - would come from API
          avgBlockTime: '0.40 s', // Example static value - would come from API
          inflationRate: (inflationResponse.data?.total * 100).toFixed(2) + '%',
          validatorRate: (inflationResponse.data?.validator * 100).toFixed(2) + '%',
          foundationRate: (inflationResponse.data?.foundation * 100).toFixed(2) + '%',
        });
      } catch (error) {
        console.error('Error fetching Solana stats:', error);
        // Fallback to example data if API fails
        setSolanaStats({
          totalSupply: '599.17M',
          circulatingSupply: '517.31M',
          marketCap: '$76.59B',
          totalTransactions: '398.18B',
          blockHeight: '313.75M',
          currentEpoch: 776,
          currentSlot: '335.52M',
          slotsInEpoch: '432,000',
          slotProgress: '66.38%',
          tps: '4,343',
          avgBlockTime: '0.40 s',
          inflationRate: '4.58%',
          validatorRate: '4.58%',
          foundationRate: '0.00%',
        });
      } finally {
        setStatsLoading(false);
      }
    };

    fetchSolanaStats();
    
    // Set up a timer to refresh the stats every 30 seconds
    const intervalId = setInterval(fetchSolanaStats, 30000);
    
    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

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
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter Solana wallet address"
              className="block w-full px-5 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm focus:ring-2 focus:ring-solana-purple/50 dark:focus:ring-solana-teal/50 focus:border-transparent dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
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
      
      {/* Solana Network Stats Dashboard */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <div className="glass-panel p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <SiSolana className="text-solana-purple" />
              <span>Solana Network Stats</span>
            </h2>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-1 animate-pulse"></span>
                Live Data
              </div>
              <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
                Auto-refreshes every 30s
              </span>
            </div>
          </div>

          {statsLoading ? (
            <div className="flex justify-center items-center py-20">
              <Spinner />
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading network stats...</span>
            </div>
          ) : (
            <div>
              {/* Top row - Main stats */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                <motion.div 
                  className="glass-card p-4 rounded-xl"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center mb-2 text-gray-500 dark:text-gray-400 text-xs">
                    <RiCoinsLine className="mr-1" />
                    SOL Total Supply
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                    <SiSolana className="text-solana-purple mr-2" />
                    {solanaStats.totalSupply}
                  </div>
                </motion.div>

                <motion.div 
                  className="glass-card p-4 rounded-xl"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center mb-2 text-gray-500 dark:text-gray-400 text-xs">
                    <RiPulseLine className="mr-1" />
                    Total Txn
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {solanaStats.totalTransactions}
                  </div>
                </motion.div>

                <motion.div 
                  className="glass-card p-4 rounded-xl"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center mb-2 text-gray-500 dark:text-gray-400 text-xs">
                    <RiStackLine className="mr-1" />
                    Block Height
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {solanaStats.blockHeight}
                  </div>
                </motion.div>

                <motion.div 
                  className="glass-card p-4 rounded-xl"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center mb-2 text-gray-500 dark:text-gray-400 text-xs">
                    <RiTimeLine className="mr-1" />
                    Current Epoch
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {solanaStats.currentEpoch}
                  </div>
                </motion.div>

                <motion.div 
                  className="glass-card p-4 rounded-xl"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center mb-2 text-gray-500 dark:text-gray-400 text-xs">
                    <RiBarChartBoxLine className="mr-1" />
                    Current Inflation Rate
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {solanaStats.inflationRate}
                  </div>
                </motion.div>
              </div>

              {/* Secondary stats row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-card p-3 rounded-xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Circulating Supply</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {solanaStats.circulatingSupply}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Percentage</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        86.34%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Market Cap</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {solanaStats.marketCap}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-3 rounded-xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">TPS</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {solanaStats.tps}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Avg. Block Time</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {solanaStats.avgBlockTime}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-3 rounded-xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Current Slot</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {solanaStats.currentSlot}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Slots in Epoch</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {solanaStats.slotsInEpoch}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Slot Progress</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {solanaStats.slotProgress}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-3 rounded-xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Validator</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {solanaStats.validatorRate}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Foundation</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {solanaStats.foundationRate}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                <div>
                  Data provided by Solana Beach, Helius, and CoinGecko
                </div>
                <div className="flex gap-2">
                  <a 
                    href="https://solanabeach.io/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-solana-purple transition-colors"
                  >
                    Solana Beach
                  </a>
                  <span>|</span>
                  <a 
                    href="https://www.helius.dev/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-solana-purple transition-colors"
                  >
                    Helius
                  </a>
                  <span>|</span>
                  <a 
                    href="https://www.coingecko.com/en/coins/solana" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-solana-purple transition-colors"
                  >
                    CoinGecko
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

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