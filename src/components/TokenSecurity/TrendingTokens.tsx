import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  RiBarChartLine, 
  RiArrowUpLine, 
  RiInformationLine, 
  RiShieldCheckLine, 
  RiShieldCrossLine,
  RiAlertLine,
  RiExternalLinkLine,
  RiThumbUpLine,
  RiRefreshLine
} from 'react-icons/ri';
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
  error?: string;
  retryCount?: number;
  retryDelay?: number;
}

const API_BASE_URL = 'https://api.rugcheck.xyz/v1';
const MAX_RETRY_ATTEMPTS = 3;
const INITIAL_DELAY = 1000; // 1 second between token loads
const RATE_LIMIT_DELAY = 3000; // Wait 3 seconds after a rate limit before trying next token
const RETRY_BACKOFF_MULTIPLIER = 2; // Exponential backoff multiplier

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

// Utility function to sleep for a given time
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function TrendingTokens() {
  const [trendingTokens, setTrendingTokens] = useState<TrendingTokenWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingQueue, setLoadingQueue] = useState<string[]>([]);
  const [currentlyLoading, setCurrentlyLoading] = useState<string | null>(null);
  const [processingPaused, setProcessingPaused] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState<number>(0);

  useEffect(() => {
    const fetchTrendingTokens = async () => {
      setLoading(true);
      try {
        const response = await axios.get<TrendingTokenResponse[]>(`${API_BASE_URL}/stats/trending`);
        // Initialize with basic data, all tokens marked as not loading yet
        setTrendingTokens(response.data.map(token => ({ 
          ...token, 
          isLoading: false,
          retryCount: 0,
          retryDelay: INITIAL_DELAY
        })));
        
        // Create a queue of tokens to load
        if (response.data.length > 0) {
          const mintAddresses = response.data.map(token => token.mint);
          setLoadingQueue(mintAddresses);
        }
      } catch (err) {
        setError('Failed to fetch trending tokens');
        console.error('Failed to fetch trending tokens:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingTokens();
  }, []);

  // Process loading queue
  useEffect(() => {
    const processQueue = async () => {
      // If we're already loading a token, the queue is empty, or processing is paused, do nothing
      if (currentlyLoading || loadingQueue.length === 0 || processingPaused) return;
      
      // Get the next token to load
      const nextMint = loadingQueue[0];
      
      // Look up the token
      const token = trendingTokens.find(t => t.mint === nextMint);
      if (!token) return;
      
      // Mark that we're starting to load this token
      setCurrentlyLoading(nextMint);
      
      // Mark the token as loading in the UI
      setTrendingTokens(prev => 
        prev.map(t => 
          t.mint === nextMint ? { ...t, isLoading: true } : t
        )
      );
      
      // Remove this token from the queue
      setLoadingQueue(prev => prev.slice(1));
      
      // Pause the queue processing while we load this token
      setProcessingPaused(true);
      
      try {
        // Calculate time since last request
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime;
        const delayNeeded = Math.max(0, INITIAL_DELAY - timeSinceLastRequest);
        
        // If we need to wait for rate limiting, do so
        if (delayNeeded > 0) {
          await sleep(delayNeeded);
        }
        
        // Load the token details
        await fetchTokenDetails(nextMint);
        
        // Record the time of this successful request
        setLastRequestTime(Date.now());
      } finally {
        // Reset current loading state
        setCurrentlyLoading(null);
        // Resume queue processing after this token is done
        // Short timeout to avoid immediate processing of next token
        setTimeout(() => {
          setProcessingPaused(false);
        }, 500); // Small buffer between tokens
      }
    };
    
    processQueue();
  }, [loadingQueue, currentlyLoading, processingPaused, trendingTokens, lastRequestTime]);

  const fetchTokenDetails = async (mint: string) => {
    if (!mint) return;

    // Get current token data
    const token = trendingTokens.find(t => t.mint === mint);
    if (!token) return;
    
    const currentRetryCount = token.retryCount || 0;
    const currentRetryDelay = token.retryDelay || INITIAL_DELAY;

    try {
      const response = await axios.get<TokenReport>(`${API_BASE_URL}/tokens/${mint}/report`);
      
      // Update token with details
      setTrendingTokens(prev => 
        prev.map(token => 
          token.mint === mint ? { 
            ...token, 
            details: response.data, 
            isLoading: false,
            error: undefined 
          } : token
        )
      );
    } catch (err: any) {
      console.error(`Failed to fetch details for token ${mint}:`, err);
      
      // Check if this was a rate limit error
      const isRateLimit = err.response?.status === 429;
      
      // Calculate appropriate delay for next retry
      const nextRetryDelay = isRateLimit 
        ? RATE_LIMIT_DELAY * Math.pow(RETRY_BACKOFF_MULTIPLIER, currentRetryCount)
        : currentRetryDelay * Math.pow(RETRY_BACKOFF_MULTIPLIER, currentRetryCount);
      
      // Format error message differently for rate limits
      const errorMessage = isRateLimit 
        ? `Rate limit exceeded. Will retry in ${Math.round(nextRetryDelay/1000)} seconds.`
        : 'Failed to load details';
      
      // Update token to show error state
      setTrendingTokens(prev => 
        prev.map(token => 
          token.mint === mint ? { 
            ...token, 
            isLoading: false, 
            error: errorMessage,
            retryCount: currentRetryCount + 1,
            retryDelay: nextRetryDelay
          } : token
        )
      );
      
      // If rate limited, add a global delay to all subsequent requests
      if (isRateLimit) {
        await sleep(RATE_LIMIT_DELAY);
      }
    }
  };

  const handleRetryLoad = (mint: string) => {
    const token = trendingTokens.find(t => t.mint === mint);
    
    // Only allow retry if under max attempts
    if (token && (token.retryCount || 0) < MAX_RETRY_ATTEMPTS) {
      // Get calculated retry delay
      const retryAfter = Date.now() + (token.retryDelay || INITIAL_DELAY);
      
      // Update UI to show pending retry
      setTrendingTokens(prev => 
        prev.map(t => 
          t.mint === mint ? { 
            ...t,
            error: `Will retry in ${Math.round((token.retryDelay || INITIAL_DELAY)/1000)} seconds...`
          } : t
        )
      );
      
      // Schedule the retry after the delay
      setTimeout(() => {
        // Add to the front of the queue for immediate loading
        setLoadingQueue(prev => [mint, ...prev]);
      }, token.retryDelay || INITIAL_DELAY);
    } else {
      // Too many retry attempts, show permanent error
      setTrendingTokens(prev => 
        prev.map(t => 
          t.mint === mint ? { 
            ...t, 
            error: `Failed after ${MAX_RETRY_ATTEMPTS} attempts. Please try again later.` 
          } : t
        )
      );
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

  // Check if there are still tokens loading
  const isStillLoading = currentlyLoading !== null || loadingQueue.length > 0;
  
  // Count of tokens that failed to load
  const failedTokens = trendingTokens.filter(t => t.error && !t.isLoading).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 gradient-text">Trending Tokens</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track popular tokens and their vote counts. Token details are loaded sequentially with rate limiting to prevent API errors.
        </p>
      </div>

      {loading && trendingTokens.length === 0 ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <Spinner />
        </div>
      ) : error && trendingTokens.length === 0 ? (
        <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Loading Status Bar */}
          <div className="glass-panel p-4 mb-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Token Loading Status */}
              <div className="flex items-center">
                {isStillLoading ? (
                  <>
                    <Spinner />
                    <span className="ml-3 text-gray-600 dark:text-gray-400">
                      Loading token details ({loadingQueue.length + (currentlyLoading ? 1 : 0)} remaining)...
                    </span>
                  </>
                ) : (
                  <span className="text-green-500 flex items-center gap-2">
                    <RiShieldCheckLine />
                    All tokens loaded
                  </span>
                )}
              </div>
              
              {/* Failure Summary */}
              {failedTokens > 0 && (
                <div className="text-sm text-yellow-500 flex items-center gap-2">
                  <RiAlertLine />
                  {failedTokens} token{failedTokens !== 1 ? 's' : ''} failed to load. 
                  Each token will automatically retry with increasing delays to avoid rate limits.
                </div>
              )}
            </div>
          </div>
          
          {/* Token Grid */}
          <div className="grid grid-cols-1 gap-6">
            {trendingTokens.map((token, index) => (
              <motion.div
                key={token.mint}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-panel p-4 rounded-xl"
              >
                {/* Token Header with Vote Info */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-white/10 dark:bg-gray-800/50 rounded-lg">
                      <RiBarChartLine className="text-2xl text-solana-teal" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {token.details?.tokenMeta?.name || token.details?.verification?.name || shortenAddress(token.mint)}
                        {token.details?.tokenMeta?.symbol && 
                          <span className="ml-2 text-sm text-gray-500">({token.details.tokenMeta.symbol})</span>
                        }
                      </h3>
                      <div className="flex items-center gap-1 text-sm">
                        <RiThumbUpLine className="text-solana-teal" />
                        <span className="font-medium">{token.up_count} upvotes</span>
                        <span className="text-gray-500">({token.vote_count} total votes)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {token.details?.verification?.jup_verified && (
                      <span className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                        <RiShieldCheckLine /> Verified
                      </span>
                    )}
                    {token.details?.rugged && (
                      <span className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                        <RiAlertLine /> RUGGED
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Token Content */}
                {token.isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Spinner />
                  </div>
                ) : token.error ? (
                  <div className="p-6 bg-red-100/20 dark:bg-red-900/10 rounded-lg text-center">
                    <p className="text-red-600 dark:text-red-400 mb-4">{token.error}</p>
                    {/* Only show retry button if not auto-retrying and under max attempts */}
                    {!token.error.includes('Will retry') && (token.retryCount || 0) < MAX_RETRY_ATTEMPTS && (
                      <button 
                        onClick={() => handleRetryLoad(token.mint)}
                        className="px-4 py-2 bg-gradient-to-r from-solana-purple to-solana-teal text-white rounded-lg flex items-center justify-center gap-2 mx-auto hover:opacity-90 transition-opacity"
                      >
                        <RiRefreshLine /> Retry Loading
                      </button>
                    )}
                  </div>
                ) : token.details ? (
                  <div>
                    {/* Token Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <div>
                        <h4 className="font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">Token Info</h4>
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                          <div className="text-gray-600 dark:text-gray-400">Mint</div>
                          <div className="text-right">
                            <a 
                              href={`https://solscan.io/token/${token.mint}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-solana-purple hover:underline inline-flex items-center gap-1"
                            >
                              {shortenAddress(token.mint)}
                              <RiExternalLinkLine />
                            </a>
                          </div>
                          
                          <div className="text-gray-600 dark:text-gray-400">Total Supply</div>
                          <div className="text-right font-medium">{formatNumber(token.details.token?.supply)}</div>
                          
                          <div className="text-gray-600 dark:text-gray-400">Price</div>
                          <div className="text-right font-medium">{formatPrice(token.details.price)}</div>
                          
                          <div className="text-gray-600 dark:text-gray-400">Market Liquidity</div>
                          <div className="text-right font-medium">{formatPrice(token.details.totalMarketLiquidity)}</div>
                          
                          <div className="text-gray-600 dark:text-gray-400">Total Holders</div>
                          <div className="text-right font-medium">{formatNumber(token.details.totalHolders)}</div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">Risk Assessment</h4>
                        
                        {/* Risk Score */}
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Risk Score</span>
                            <span className={`font-bold text-sm ${getRiskColor(token.details.score_normalised || 0)}`}>
                              {token.details.score_normalised || 0}/100
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                token.details.score_normalised <= 30 ? 'bg-green-500' :
                                token.details.score_normalised <= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${token.details.score_normalised}%` }}
                            ></div>
                          </div>
                          <div className="mt-1 text-xs text-gray-500 text-right">
                            {token.details.score_normalised <= 30 ? 'Low Risk' :
                             token.details.score_normalised <= 60 ? 'Medium Risk' : 'High Risk'}
                          </div>
                        </div>
                        
                        {/* Risk Factors */}
                        {token.details.risks && token.details.risks.length > 0 ? (
                          <div>
                            <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Top Risk Factors</h5>
                            <div className="space-y-1 max-h-32 overflow-y-auto pr-2">
                              {token.details.risks.slice(0, 3).map((risk, idx) => (
                                <div key={idx} className="flex items-center gap-1 text-sm">
                                  <span className={
                                    risk.level === 'high' || risk.level === 'danger' ? 'text-red-500' :
                                    risk.level === 'medium' || risk.level === 'warn' ? 'text-yellow-500' :
                                    'text-green-500'
                                  }>
                                    <RiAlertLine />
                                  </span>
                                  <span>{risk.name}</span>
                                </div>
                              ))}
                              {token.details.risks.length > 3 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  +{token.details.risks.length - 3} more risk factors
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            No risk factors detected
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Description if available */}
                    {(token.details.verification?.description || token.details.tokenMeta?.uri) && (
                      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 bg-white/5 dark:bg-black/10 p-3 rounded-lg">
                        <h4 className="font-medium mb-1">Description</h4>
                        <p className="line-clamp-3">
                          {token.details.verification?.description || 'No description available'}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">Waiting to load token data...</div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 