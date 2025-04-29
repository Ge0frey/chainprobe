import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { fetchWalletTransactions, fetchTokenBalances, HeliusTransaction, fetchEnhancedTransaction, EnhancedTransaction } from '../services/solana';
import { getComprehensiveRiskAnalysis } from '../services/webacy';
import { fetchDuneTokenBalances, DuneTokenBalance } from '../services/dune';
import { Spinner } from './ui/Spinner';
import { RiskScoreCard } from './ui/RiskScoreCard';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
  RadialLinearScale,
  ArcElement,
  PolarAreaController,
  PieController,
  DoughnutController
} from 'chart.js';
import { Bar, Line, Doughnut, PolarArea } from 'react-chartjs-2';
import { DateTime } from 'luxon';
import 'chartjs-adapter-luxon';
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
  RiBarChartBoxLine,
  RiPieChartLine,
  RiLineChartLine,
  RiCalendarLine,
  RiRadarLine
} from 'react-icons/ri';
import { SiSolana } from 'react-icons/si';
import { Player } from '@lottiefiles/react-lottie-player';
import { FeaturesSection } from './ui/FeaturesSection';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  TimeScale,
  RadialLinearScale,
  ArcElement,
  PolarAreaController,
  PieController,
  DoughnutController,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Import API keys from environment variables
const HELIUS_API_KEY = import.meta.env.VITE_HELIUS_API_KEY;
// For Solana Beach API key, you should add this to your .env file
const SOLANA_BEACH_API_KEY = import.meta.env.VITE_SOLANA_BEACH_API_KEY || '';

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

// Type definition for transaction patterns and visualizations
interface TransactionPatternData {
  hourlyActivity: {
    hour: number;
    count: number;
  }[];
  dailyActivity: {
    date: string;
    count: number;
  }[];
  transactionTypeDistribution: {
    type: string;
    count: number;
  }[];
  volumeOverTime: {
    date: string;
    volume: number;
  }[];
  feeStats: {
    min: number;
    max: number;
    avg: number;
    total: number;
  };
}

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

// Add these type definitions near the top of the file, after the imports
interface TokenTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  tokenAmount: number | string;
  mint: string;
}

interface NativeTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  amount: number;
}

interface Token {
  mint: string;
  logo?: string;
  symbol?: string;
  uiAmount: string;
  value?: number;
}

export default function Dashboard() {
  const [searchInput, setSearchInput] = useState('');
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [solanaStats, setSolanaStats] = useState<SolanaNetworkStats>({});
  const [statsLoading, setStatsLoading] = useState(true);
  const [patternData, setPatternData] = useState<TransactionPatternData | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  
  // Chart references for animations - using any type to avoid TypeScript issues
  const hourlyChartRef = useRef<any>(null);
  const typeChartRef = useRef<any>(null);
  const volumeChartRef = useRef<any>(null);
  const activityChartRef = useRef<any>(null);
  
  // Process transactions into visualization data
  const processTransactionPatterns = (transactions: HeliusTransaction[]) => {
    if (!transactions || transactions.length === 0) {
      return null;
    }
    
    // Hour of day activity (0-23)
    const hourlyMap = new Map<number, number>();
    for (let i = 0; i < 24; i++) hourlyMap.set(i, 0);
    
    // Daily activity for past 30 days
    const thirtyDaysAgo = DateTime.now().minus({ days: 30 }).toMillis();
    const dailyMap = new Map<string, number>();
    const volumeMap = new Map<string, number>();
    const now = DateTime.now();
    for (let i = 0; i < 30; i++) {
      const date = now.minus({ days: i }).toFormat('yyyy-MM-dd');
      dailyMap.set(date, 0);
      volumeMap.set(date, 0);
    }
    
    // Transaction type distribution
    const typeMap = new Map<string, number>();
    
    // Fee stats
    let minFee = Number.MAX_VALUE;
    let maxFee = 0;
    let totalFee = 0;
    
    // Process each transaction
    transactions.forEach(tx => {
      // Transaction hour (local time)
      const txDate = DateTime.fromSeconds(tx.blockTime);
      const hour = txDate.hour;
      hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
      
      // Transaction day
      if (tx.blockTime * 1000 >= thirtyDaysAgo) {
        const dateKey = txDate.toFormat('yyyy-MM-dd');
        dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + 1);
        
        // Volume over time (use amount if available, or 1 as placeholder)
        const txAmount = tx.amount || 0;
        volumeMap.set(dateKey, (volumeMap.get(dateKey) || 0) + txAmount);
      }
      
      // Transaction type
      const type = tx.type || 'UNKNOWN';
      typeMap.set(type, (typeMap.get(type) || 0) + 1);
      
      // Fee stats
      const fee = tx.fee / 1e9; // Convert lamports to SOL
      minFee = Math.min(minFee, fee);
      maxFee = Math.max(maxFee, fee);
      totalFee += fee;
    });
    
    // Format the data for charts
    const hourlyActivity = Array.from(hourlyMap).map(([hour, count]) => ({ hour, count }));
    const dailyActivity = Array.from(dailyMap).map(([date, count]) => ({ date, count }));
    const volumeOverTime = Array.from(volumeMap).map(([date, volume]) => ({ date, volume }));
    const transactionTypeDistribution = Array.from(typeMap).map(([type, count]) => ({ type, count }));
    
    // Calculate average fee
    const avgFee = totalFee / transactions.length;
    
    return {
      hourlyActivity,
      dailyActivity,
      transactionTypeDistribution,
      volumeOverTime,
      feeStats: {
        min: minFee,
        max: maxFee,
        avg: avgFee,
        total: totalFee
      }
    };
  };
  
  // Apply time range filter to pattern data
  const getFilteredPatternData = () => {
    if (!patternData) return null;
    
    // Filter based on selected time range
    const now = DateTime.now();
    const dailyActivity = [...patternData.dailyActivity].sort((a, b) => a.date.localeCompare(b.date));
    const volumeOverTime = [...patternData.volumeOverTime].sort((a, b) => a.date.localeCompare(b.date));
    
    let filteredDaily = dailyActivity;
    let filteredVolume = volumeOverTime;
    
    if (timeRange === '24h') {
      const yesterday = now.minus({ days: 1 }).toFormat('yyyy-MM-dd');
      filteredDaily = dailyActivity.filter(item => item.date >= yesterday);
      filteredVolume = volumeOverTime.filter(item => item.date >= yesterday);
    } else if (timeRange === '7d') {
      const sevenDaysAgo = now.minus({ days: 7 }).toFormat('yyyy-MM-dd');
      filteredDaily = dailyActivity.filter(item => item.date >= sevenDaysAgo);
      filteredVolume = volumeOverTime.filter(item => item.date >= sevenDaysAgo);
    } else if (timeRange === '30d') {
      const thirtyDaysAgo = now.minus({ days: 30 }).toFormat('yyyy-MM-dd');
      filteredDaily = dailyActivity.filter(item => item.date >= thirtyDaysAgo);
      filteredVolume = volumeOverTime.filter(item => item.date >= thirtyDaysAgo);
    }
    
    return {
      ...patternData,
      dailyActivity: filteredDaily,
      volumeOverTime: filteredVolume
    };
  };
  
  // Fetch Solana network stats
  useEffect(() => {
    const fetchSolanaStats = async () => {
      setStatsLoading(true);
      try {
        // Define common headers for Solana Beach API
        const solanaBeachHeaders = {
          'Accept': 'application/json',
          'Authorization': `Bearer ${SOLANA_BEACH_API_KEY}`
        };

        // Fetch supply data from Solana Beach API
        const supplyResponse = await axios.get('https://api.solanabeach.io/v1/supply', {
          headers: solanaBeachHeaders
        });

        // Fetch inflation data from Solana Beach API
        const inflationResponse = await axios.get('https://api.solanabeach.io/v1/inflation', {
          headers: solanaBeachHeaders
        });

        // Fetch network health from Solana Beach API
        const healthResponse = await axios.get('https://api.solanabeach.io/v1/health', {
          headers: solanaBeachHeaders
        });

        // Fetch from Helius API using the imported API key
        const heliusResponse = await axios.get(`https://api.helius.xyz/v0/blocks/latest?api-key=${HELIUS_API_KEY}`);

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

  // Fetch token balances
  const { 
    data: tokenBalances, 
    isLoading: balancesLoading 
  } = useQuery<DuneTokenBalance[]>({
    queryKey: ['dune-token-balances', currentAddress],
    queryFn: async () => {
      if (!currentAddress) return [];
      return await fetchDuneTokenBalances(currentAddress);
    },
    enabled: !!currentAddress,
  });
  
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

  // Process transaction patterns when transactions are loaded
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      const patterns = processTransactionPatterns(transactions);
      setPatternData(patterns);
    }
  }, [transactions]);

  // Add risk analysis query
  const {
    data: riskAnalysis,
    isLoading: riskLoading,
  } = useQuery({
    queryKey: ['risk-analysis', currentAddress],
    queryFn: () => currentAddress ? getComprehensiveRiskAnalysis(currentAddress) : null,
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
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-solana-purple to-solana-teal bg-clip-text text-transparent">
            Solana Network Overview
          </h1>
          <p className="text-muted-foreground">
            Monitor network statistics and analyze blockchain activity
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
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
            {/* Left column - Transactions and Transaction Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Transactions */}
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

              {/* Transaction Details - Now below transactions */}
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
                              {transactionDetails.nativeTransfers.map((transfer: NativeTransfer, idx: number) => (
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
                              {transactionDetails.tokenTransfers.map((transfer: TokenTransfer, idx: number) => (
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

              {/* Transaction Pattern Visualizations */}
              {patternData && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass-panel overflow-hidden rounded-xl"
                >
                  <div className="p-4 border-b border-gray-200/70 dark:border-gray-700/70">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Transaction Patterns</h2>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Time Range:</span>
                        <div className="flex space-x-1">
                          {['24h', '7d', '30d', 'all'].map((range) => (
                            <button
                              key={range}
                              onClick={() => setTimeRange(range as any)}
                              className={`px-2 py-1 text-xs rounded-md ${
                                timeRange === range 
                                  ? 'bg-solana-purple text-white' 
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {range}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Visualization grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                    {/* Transaction Type Distribution */}
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 }}
                      className="glass-card p-4 rounded-xl"
                    >
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                        <RiPieChartLine className="mr-2 text-solana-purple" />
                        Transaction Type Distribution
                      </h3>
                      <div className="h-64">
                        <Doughnut
                          ref={typeChartRef}
                          data={{
                            labels: patternData.transactionTypeDistribution.map(item => item.type),
                            datasets: [
                              {
                                data: patternData.transactionTypeDistribution.map(item => item.count),
                                backgroundColor: [
                                  'rgba(153, 69, 255, 0.8)',  // Solana Purple
                                  'rgba(20, 241, 149, 0.8)',  // Solana Teal
                                  'rgba(0, 194, 255, 0.8)',   // Solana Blue
                                  'rgba(139, 229, 62, 0.8)',  // Solana Lime
                                  'rgba(249, 214, 73, 0.8)',  // Solana Yellow
                                  'rgba(255, 107, 107, 0.8)', // Solana Pink
                                  'rgba(255, 137, 6, 0.8)',   // Solana Orange
                                  'rgba(159, 122, 234, 0.8)', // More purples
                                  'rgba(80, 227, 194, 0.8)'   // More teals
                                ],
                                borderColor: [
                                  'rgba(153, 69, 255, 1)',
                                  'rgba(20, 241, 149, 1)',
                                  'rgba(0, 194, 255, 1)',
                                  'rgba(139, 229, 62, 1)',
                                  'rgba(249, 214, 73, 1)',
                                  'rgba(255, 107, 107, 1)',
                                  'rgba(255, 137, 6, 1)',
                                  'rgba(159, 122, 234, 1)',
                                  'rgba(80, 227, 194, 1)'
                                ],
                                borderWidth: 1,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'right',
                                labels: {
                                  boxWidth: 12,
                                  font: {
                                    size: 10
                                  },
                                  color: document.documentElement.classList.contains('dark') 
                                    ? 'rgb(229, 231, 235)' 
                                    : 'rgb(75, 85, 99)'
                                }
                              },
                              tooltip: {
                                callbacks: {
                                  label: (context) => {
                                    const label = context.label || '';
                                    const value = context.raw as number;
                                    const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0) as number;
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return `${label}: ${value} (${percentage}%)`;
                                  }
                                }
                              }
                            },
                            animation: {
                              animateRotate: true,
                              animateScale: true
                            }
                          }}
                        />
                      </div>
                    </motion.div>
                    
                    {/* Hourly Activity Heatmap */}
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                      className="glass-card p-4 rounded-xl"
                    >
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                        <RiTimeLine className="mr-2 text-solana-teal" />
                        Hourly Activity Pattern
                      </h3>
                      <div className="h-64">
                        <Bar
                          ref={hourlyChartRef}
                          data={{
                            labels: patternData.hourlyActivity.map(item => 
                              `${item.hour}:00${item.hour < 12 ? 'am' : 'pm'}`
                            ),
                            datasets: [
                              {
                                label: 'Transaction Count',
                                data: patternData.hourlyActivity.map(item => item.count),
                                backgroundColor: (context) => {
                                  const ctx = context.chart.ctx;
                                  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                                  gradient.addColorStop(0, 'rgba(20, 241, 149, 0.8)');
                                  gradient.addColorStop(1, 'rgba(20, 241, 149, 0.2)');
                                  return gradient;
                                },
                                borderColor: 'rgba(20, 241, 149, 1)',
                                borderWidth: 1,
                                borderRadius: 4,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false,
                              },
                              tooltip: {
                                callbacks: {
                                  title: (tooltipItems) => {
                                    return `Hour: ${tooltipItems[0].label}`;
                                  },
                                  label: (context) => {
                                    return `Transactions: ${context.raw}`;
                                  }
                                }
                              }
                            },
                            scales: {
                              x: {
                                grid: {
                                  display: false,
                                },
                                ticks: {
                                  maxRotation: 0,
                                  autoSkip: true,
                                  maxTicksLimit: 12,
                                  color: document.documentElement.classList.contains('dark') 
                                    ? 'rgba(229, 231, 235, 0.8)' 
                                    : 'rgba(75, 85, 99, 0.8)'
                                }
                              },
                              y: {
                                beginAtZero: true,
                                grid: {
                                  color: document.documentElement.classList.contains('dark') 
                                    ? 'rgba(75, 85, 99, 0.2)' 
                                    : 'rgba(209, 213, 219, 0.2)',
                                },
                                ticks: {
                                  color: document.documentElement.classList.contains('dark') 
                                    ? 'rgba(229, 231, 235, 0.8)' 
                                    : 'rgba(75, 85, 99, 0.8)'
                                }
                              }
                            },
                            animation: {
                              duration: 2000
                            }
                          }}
                        />
                      </div>
                    </motion.div>
                    
                    {/* Daily Activity Over Time */}
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 }}
                      className="glass-card p-4 rounded-xl"
                    >
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                        <RiCalendarLine className="mr-2 text-solana-blue" />
                        Transaction Activity
                      </h3>
                      <div className="h-64">
                        <Line
                          ref={activityChartRef}
                          data={{
                            labels: getFilteredPatternData()?.dailyActivity.map(item => item.date) || [],
                            datasets: [
                              {
                                label: 'Transaction Count',
                                data: getFilteredPatternData()?.dailyActivity.map(item => item.count) || [],
                                borderColor: 'rgba(0, 194, 255, 1)',
                                backgroundColor: 'rgba(0, 194, 255, 0.1)',
                                fill: true,
                                tension: 0.4,
                                pointBackgroundColor: 'rgba(0, 194, 255, 1)',
                                pointBorderColor: '#fff',
                                pointRadius: 4,
                                pointHoverRadius: 6,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false,
                              },
                              tooltip: {
                                callbacks: {
                                  title: (tooltipItems) => {
                                    return DateTime.fromFormat(tooltipItems[0].label, 'yyyy-MM-dd').toFormat('MMM dd, yyyy');
                                  }
                                }
                              }
                            },
                            scales: {
                              x: {
                                type: 'time',
                                time: {
                                  unit: timeRange === '24h' ? 'hour' : 'day',
                                  tooltipFormat: 'MMM dd, yyyy',
                                  displayFormats: {
                                    day: 'MMM dd'
                                  }
                                },
                                grid: {
                                  display: false,
                                },
                                ticks: {
                                  maxRotation: 45,
                                  color: document.documentElement.classList.contains('dark') 
                                    ? 'rgba(229, 231, 235, 0.8)' 
                                    : 'rgba(75, 85, 99, 0.8)'
                                }
                              },
                              y: {
                                beginAtZero: true,
                                grid: {
                                  color: document.documentElement.classList.contains('dark') 
                                    ? 'rgba(75, 85, 99, 0.2)' 
                                    : 'rgba(209, 213, 219, 0.2)',
                                },
                                ticks: {
                                  precision: 0,
                                  color: document.documentElement.classList.contains('dark') 
                                    ? 'rgba(229, 231, 235, 0.8)' 
                                    : 'rgba(75, 85, 99, 0.8)'
                                }
                              }
                            },
                            animation: {
                              duration: 2000
                            }
                          }}
                        />
                      </div>
                    </motion.div>
                    
                    {/* Volume Over Time */}
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 }}
                      className="glass-card p-4 rounded-xl"
                    >
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                        <RiLineChartLine className="mr-2 text-solana-pink" />
                        Transaction Volume
                      </h3>
                      <div className="h-64">
                        <Bar
                          ref={volumeChartRef}
                          data={{
                            labels: getFilteredPatternData()?.volumeOverTime.map(item => item.date) || [],
                            datasets: [
                              {
                                label: 'Transaction Volume',
                                data: getFilteredPatternData()?.volumeOverTime.map(item => item.volume) || [],
                                backgroundColor: (context) => {
                                  const ctx = context.chart.ctx;
                                  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                                  gradient.addColorStop(0, 'rgba(255, 107, 107, 0.8)');
                                  gradient.addColorStop(1, 'rgba(255, 107, 107, 0.2)');
                                  return gradient;
                                },
                                borderColor: 'rgba(255, 107, 107, 1)',
                                borderWidth: 1,
                                borderRadius: 4,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false,
                              },
                              tooltip: {
                                callbacks: {
                                  title: (tooltipItems) => {
                                    return DateTime.fromFormat(tooltipItems[0].label, 'yyyy-MM-dd').toFormat('MMM dd, yyyy');
                                  }
                                }
                              }
                            },
                            scales: {
                              x: {
                                type: 'time',
                                time: {
                                  unit: timeRange === '24h' ? 'hour' : 'day',
                                  tooltipFormat: 'MMM dd, yyyy',
                                  displayFormats: {
                                    day: 'MMM dd'
                                  }
                                },
                                grid: {
                                  display: false,
                                },
                                ticks: {
                                  maxRotation: 45,
                                  color: document.documentElement.classList.contains('dark') 
                                    ? 'rgba(229, 231, 235, 0.8)' 
                                    : 'rgba(75, 85, 99, 0.8)'
                                }
                              },
                              y: {
                                beginAtZero: true,
                                grid: {
                                  color: document.documentElement.classList.contains('dark') 
                                    ? 'rgba(75, 85, 99, 0.2)' 
                                    : 'rgba(209, 213, 219, 0.2)',
                                },
                                ticks: {
                                  color: document.documentElement.classList.contains('dark') 
                                    ? 'rgba(229, 231, 235, 0.8)' 
                                    : 'rgba(75, 85, 99, 0.8)'
                                }
                              }
                            },
                            animation: {
                              duration: 2000
                            }
                          }}
                        />
                      </div>
                    </motion.div>
                    
                    {/* Fee Statistics */}
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 }}
                      className="glass-card p-4 rounded-xl md:col-span-2"
                    >
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                        <SiSolana className="mr-2 text-solana-purple" />
                        Fee Statistics
                      </h3>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 rounded-xl border border-purple-100 dark:border-purple-800/30">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Minimum Fee</p>
                          <p className="text-xl font-bold text-purple-700 dark:text-purple-300">{patternData.feeStats.min.toFixed(6)} SOL</p>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-teal-50 dark:from-blue-900/30 dark:to-teal-900/30 rounded-xl border border-blue-100 dark:border-blue-800/30">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Maximum Fee</p>
                          <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{patternData.feeStats.max.toFixed(6)} SOL</p>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-teal-50 to-green-50 dark:from-teal-900/30 dark:to-green-900/30 rounded-xl border border-teal-100 dark:border-teal-800/30">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Average Fee</p>
                          <p className="text-xl font-bold text-teal-700 dark:text-teal-300">{patternData.feeStats.avg.toFixed(6)} SOL</p>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-green-50 to-lime-50 dark:from-green-900/30 dark:to-lime-900/30 rounded-xl border border-green-100 dark:border-green-800/30">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Total Fees</p>
                          <p className="text-xl font-bold text-green-700 dark:text-green-300">{patternData.feeStats.total.toFixed(6)} SOL</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right column - Token Holdings and Risk Assessment */}
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
                          key={token.address} 
                          className="py-3"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * tokenBalances.indexOf(token) }}
                        >
                          <div className="flex items-center space-x-3">
                            {token.token_metadata?.logo ? (
                              <div className="flex-shrink-0 h-8 w-8 p-1 bg-white dark:bg-gray-700 rounded-full shadow-sm">
                                <img 
                                  src={token.token_metadata.logo} 
                                  alt={token.symbol || 'token'} 
                                  className="h-full w-full rounded-full"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600"></div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {token.symbol || token.address.slice(0, 8)}...
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {parseFloat(token.amount).toFixed(token.decimals > 4 ? 4 : token.decimals)}
                              </p>
                            </div>
                            {token.value_usd !== undefined && (
                              <div className="inline-flex items-center text-sm font-medium text-gray-900 dark:text-white">
                                ${token.value_usd.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}

              {/* Risk Assessment */}
              <RiskScoreCard
                score={riskAnalysis?.overallRiskScore || 0}
                loading={riskLoading}
                details={riskAnalysis?.threatRisks?.details}
                threatRisks={riskAnalysis?.threatRisks}
                sanctionChecks={riskAnalysis?.sanctionChecks}
                approvalRisks={riskAnalysis?.approvalRisks}
                exposureRisk={riskAnalysis?.exposureRisk}
                contractRisk={riskAnalysis?.contractRisk}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 