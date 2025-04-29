import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { RiBarChartLine, RiArrowUpLine, RiInformationLine, RiShieldCheckLine, RiShieldCrossLine } from 'react-icons/ri';
import { Spinner } from '../ui/Spinner';
import { TokenReport } from '../RugCheck/types';

// Define interface for the actual API response
interface TrendingTokenResponse {
  mint: string;
  vote_count: number;
  up_count: number;
}

// Extended interface with token details
interface TrendingTokenWithDetails extends TrendingTokenResponse {
  details?: TokenReport;
  isLoading?: boolean;
}

const API_BASE_URL = 'https://api.rugcheck.xyz/v1';

// Function to shorten the mint address for display
const shortenAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
};

// Utility function for risk color
const getRiskColor = (score: number) => {
  if (score <= 30) return 'text-green-500';
  if (score <= 60) return 'text-yellow-500';
  return 'text-red-500';
};

export default function TrendingTokens() {
  const [trendingTokens, setTrendingTokens] = useState<TrendingTokenWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTokenMint, setExpandedTokenMint] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrendingTokens = async () => {
      setLoading(true);
      try {
        const response = await axios.get<TrendingTokenResponse[]>(`${API_BASE_URL}/stats/trending`);
        setTrendingTokens(response.data);
      } catch (err) {
        setError('Failed to fetch trending tokens');
        console.error('Failed to fetch trending tokens:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingTokens();
  }, []);

  const fetchTokenDetails = async (mint: string) => {
    if (!mint) return;

    // Update token to show loading state
    setTrendingTokens(prev => 
      prev.map(token => 
        token.mint === mint ? { ...token, isLoading: true } : token
      )
    );

    try {
      const response = await axios.get<TokenReport>(`${API_BASE_URL}/tokens/${mint}/report`);
      
      // Update token with details
      setTrendingTokens(prev => 
        prev.map(token => 
          token.mint === mint ? { ...token, details: response.data, isLoading: false } : token
        )
      );
    } catch (err) {
      console.error(`Failed to fetch details for token ${mint}:`, err);
      
      // Update token to show error state
      setTrendingTokens(prev => 
        prev.map(token => 
          token.mint === mint ? { ...token, isLoading: false } : token
        )
      );
    }
  };

  const handleTokenClick = (mint: string) => {
    if (expandedTokenMint === mint) {
      setExpandedTokenMint(null);
      return;
    }
    
    setExpandedTokenMint(mint);
    
    const token = trendingTokens.find(t => t.mint === mint);
    if (!token?.details && !token?.isLoading) {
      fetchTokenDetails(mint);
    }
  };

  const formatNumber = (value: number | undefined) => {
    if (typeof value === 'undefined' || value === null) return '0';
    return value.toLocaleString();
  };

  const formatPrice = (value: number | undefined) => {
    if (typeof value === 'undefined' || value === null) return '$0.00';
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 gradient-text">Trending Tokens</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track popular tokens and their vote counts. Click on a token to see more details.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <Spinner />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : (
        <div className="glass-panel p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <RiBarChartLine className="text-solana-teal" />
            Trending Tokens
          </h2>
          
          {trendingTokens.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">No trending tokens available</p>
          ) : (
            <div className="space-y-4">
              {trendingTokens.map((token, index) => (
                <motion.div
                  key={token.mint}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 bg-white/5 dark:bg-black/10 rounded-lg border border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-white/10 dark:hover:bg-black/20 transition-all"
                  onClick={() => handleTokenClick(token.mint)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">
                        {token.details?.tokenMeta?.name || shortenAddress(token.mint)}
                        {token.details?.tokenMeta?.symbol && 
                          <span className="ml-2 text-sm text-gray-500">({token.details.tokenMeta.symbol})</span>
                        }
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {shortenAddress(token.mint)}
                        <a 
                          href={`https://solscan.io/token/${token.mint}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-2 text-solana-purple hover:underline inline-flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <RiInformationLine /> View on Solscan
                        </a>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold flex items-center gap-1 justify-end">
                        <span className="text-solana-teal"><RiArrowUpLine /></span> 
                        {token.up_count} upvotes
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Total votes: {token.vote_count}
                      </p>
                    </div>
                  </div>

                  {/* Token Details (Expanded) */}
                  {expandedTokenMint === token.mint && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800"
                    >
                      {token.isLoading ? (
                        <div className="flex justify-center py-6">
                          <Spinner />
                        </div>
                      ) : token.details ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Token Overview */}
                          <div>
                            <h3 className="font-medium mb-2">Token Info</h3>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Name</span>
                                <span className="font-medium">{token.details.tokenMeta?.name || 'Unknown'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Symbol</span>
                                <span className="font-medium">{token.details.tokenMeta?.symbol || 'Unknown'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Total Supply</span>
                                <span className="font-medium">{formatNumber(token.details.token?.supply)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Holders</span>
                                <span className="font-medium">{formatNumber(token.details.totalHolders)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Price</span>
                                <span className="font-medium">{formatPrice(token.details.price)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Liquidity</span>
                                <span className="font-medium">{formatPrice(token.details.totalMarketLiquidity)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Risk Assessment */}
                          <div>
                            <h3 className="font-medium mb-2">Risk Assessment</h3>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400">Risk Score</span>
                                <span className={`font-bold ${getRiskColor(token.details.score_normalised || 0)}`}>
                                  {token.details.score_normalised || 0}/100
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400">Verification</span>
                                {token.details.verification?.jup_verified ? (
                                  <span className="text-green-500 flex items-center gap-1">
                                    <RiShieldCheckLine /> Verified
                                  </span>
                                ) : (
                                  <span className="text-yellow-500 flex items-center gap-1">
                                    <RiShieldCrossLine /> Unverified
                                  </span>
                                )}
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400">Rug Status</span>
                                {token.details.rugged ? (
                                  <span className="text-red-500 font-bold">RUGGED</span>
                                ) : (
                                  <span className="text-green-500">No rug detected</span>
                                )}
                              </div>
                            </div>

                            {/* Risks */}
                            {token.details.risks && token.details.risks.length > 0 && (
                              <div className="mt-4">
                                <h3 className="font-medium mb-2">Risk Factors</h3>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                  {token.details.risks.map((risk, idx) => (
                                    <div key={idx} className="text-sm">
                                      <span className={
                                        risk.level === 'high' || risk.level === 'danger' ? 'text-red-500' :
                                        risk.level === 'medium' || risk.level === 'warn' ? 'text-yellow-500' :
                                        'text-green-500'
                                      }>
                                        • {risk.name}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-center py-2 text-gray-600 dark:text-gray-400">
                          Could not load token details
                        </p>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 