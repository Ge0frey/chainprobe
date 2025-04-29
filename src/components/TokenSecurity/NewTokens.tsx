import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  RiTimeLine, 
  RiInformationLine, 
  RiFileCodeLine, 
  RiUserLine, 
  RiLockLine, 
  RiHashtag,
  RiExternalLinkLine,
  RiCalendarLine
} from 'react-icons/ri';
import { Spinner } from '../ui/Spinner';

// Define interface for the actual API response
interface NewTokenResponse {
  mint: string;
  decimals: number;
  symbol: string;
  creator: string;
  mintAuthority: string;
  freezeAuthority: string;
  program: string;
  createAt: string;
  updatedAt: string;
  events: any[] | null;
}

const API_BASE_URL = 'https://api.rugcheck.xyz/v1';

// Function to shorten the address for display
const shortenAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
};

// Function to format date for display
const formatDate = (dateString: string) => {
  if (!dateString) return 'Invalid Date';
  const date = new Date(dateString);
  return date.toLocaleString();
};

export default function NewTokens() {
  const [newTokens, setNewTokens] = useState<NewTokenResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNewTokens = async () => {
      setLoading(true);
      try {
        const response = await axios.get<NewTokenResponse[]>(`${API_BASE_URL}/stats/new_tokens`);
        setNewTokens(response.data);
      } catch (err) {
        setError('Failed to fetch new tokens');
        console.error('Failed to fetch new tokens:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNewTokens();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 gradient-text">New Tokens</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor recently created tokens on the Solana network. All token details are displayed for easy viewing.
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
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {newTokens.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8 glass-panel">No new tokens available</p>
            ) : (
              newTokens.map((token, index) => (
                <motion.div
                  key={token.mint}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-panel p-4 rounded-xl"
                >
                  {/* Token Header */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-white/10 dark:bg-gray-800/50 rounded-lg">
                        <RiTimeLine className="text-2xl text-solana-purple" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {token.symbol || 'Unknown'}
                        </h3>
                        <div className="flex items-center gap-1 text-sm">
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
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <RiCalendarLine />
                        {formatDate(token.createAt)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Token Content */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    {/* Left Column - Token Details */}
                    <div>
                      <h4 className="font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">Token Details</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <RiHashtag className="text-solana-purple" />
                          <span className="text-gray-600 dark:text-gray-400">Decimals:</span>
                          <span className="font-medium">{token.decimals}</span>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 text-sm mb-1">
                            <RiUserLine className="text-solana-purple" />
                            <span className="text-gray-600 dark:text-gray-400">Creator:</span>
                          </div>
                          <div className="pl-6">
                            <div className="font-medium text-xs break-all flex gap-1 items-center">
                              {token.creator}
                              <a 
                                href={`https://solscan.io/account/${token.creator}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-solana-teal hover:underline"
                              >
                                <RiExternalLinkLine />
                              </a>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 text-sm mb-1">
                            <RiFileCodeLine className="text-solana-orange" />
                            <span className="text-gray-600 dark:text-gray-400">Token Program:</span>
                          </div>
                          <div className="pl-6">
                            <div className="font-medium text-xs break-all flex gap-1 items-center">
                              {token.program}
                              <a 
                                href={`https://solscan.io/account/${token.program}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-solana-teal hover:underline"
                              >
                                <RiExternalLinkLine />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right Column - Authorities & Timestamps */}
                    <div>
                      <h4 className="font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">Authorities</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center gap-2 text-sm mb-1">
                            <RiLockLine className="text-solana-teal" />
                            <span className="text-gray-600 dark:text-gray-400">Mint Authority:</span>
                          </div>
                          <div className="pl-6">
                            <div className="font-medium text-xs break-all">
                              {token.mintAuthority || 'None'}
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 text-sm mb-1">
                            <RiLockLine className="text-solana-teal" />
                            <span className="text-gray-600 dark:text-gray-400">Freeze Authority:</span>
                          </div>
                          <div className="pl-6">
                            <div className="font-medium text-xs break-all">
                              {token.freezeAuthority || 'None'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Timestamps</h5>
                          <div className="grid grid-cols-1 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Created:</span>
                              <span className="ml-2 font-medium">{formatDate(token.createAt)}</span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Updated:</span>
                              <span className="ml-2 font-medium">{formatDate(token.updatedAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
} 