import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { RiTimeLine, RiInformationLine, RiFileCodeLine, RiUserLine, RiLockLine, RiHashtag } from 'react-icons/ri';
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
  const [expandedTokenMint, setExpandedTokenMint] = useState<string | null>(null);

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

  const handleTokenClick = (mint: string) => {
    if (expandedTokenMint === mint) {
      setExpandedTokenMint(null);
    } else {
      setExpandedTokenMint(mint);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 gradient-text">New Tokens</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor recently created tokens on the Solana network. Click on a token to see more details.
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
            <RiTimeLine className="text-solana-purple" />
            New Tokens
          </h2>
          
          {newTokens.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">No new tokens available</p>
          ) : (
            <div className="space-y-4">
              {newTokens.map((token, index) => (
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
                      <p className="font-semibold">{token.symbol || 'Unknown'}</p>
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
                    <p className="text-sm text-gray-500">
                      {formatDate(token.createAt)}
                    </p>
                  </div>

                  {/* Token Details (Expanded) */}
                  {expandedTokenMint === token.mint && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Token Details */}
                        <div>
                          <h3 className="font-medium mb-2">Token Details</h3>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <RiHashtag className="text-solana-purple" />
                              <span className="text-gray-600 dark:text-gray-400">Decimals:</span>
                              <span className="font-medium">{token.decimals}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <RiUserLine className="text-solana-purple mt-1" />
                              <span className="text-gray-600 dark:text-gray-400">Creator:</span>
                              <span className="font-medium break-all">
                                {token.creator}
                                <a 
                                  href={`https://solscan.io/account/${token.creator}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="ml-2 text-solana-teal hover:underline inline-flex items-center gap-1 text-sm"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <RiInformationLine /> View
                                </a>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Authorities */}
                        <div>
                          <h3 className="font-medium mb-2">Authorities</h3>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <RiLockLine className="text-solana-teal mt-1" />
                              <span className="text-gray-600 dark:text-gray-400">Mint Authority:</span>
                              <span className="font-medium break-all">
                                {token.mintAuthority || 'None'}
                              </span>
                            </div>
                            <div className="flex items-start gap-2">
                              <RiLockLine className="text-solana-teal mt-1" />
                              <span className="text-gray-600 dark:text-gray-400">Freeze Authority:</span>
                              <span className="font-medium break-all">
                                {token.freezeAuthority || 'None'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Program */}
                        <div className="md:col-span-2">
                          <h3 className="font-medium mb-2">Program</h3>
                          <div className="flex items-start gap-2">
                            <RiFileCodeLine className="text-solana-orange mt-1" />
                            <span className="text-gray-600 dark:text-gray-400">Token Program:</span>
                            <span className="font-medium break-all">
                              {token.program}
                              <a 
                                href={`https://solscan.io/account/${token.program}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="ml-2 text-solana-teal hover:underline inline-flex items-center gap-1 text-sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <RiInformationLine /> View
                              </a>
                            </span>
                          </div>
                        </div>

                        {/* Timestamps */}
                        <div className="md:col-span-2">
                          <h3 className="font-medium mb-2">Timestamps</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Created At:</span>
                              <span className="ml-2 font-medium">{formatDate(token.createAt)}</span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Updated At:</span>
                              <span className="ml-2 font-medium">{formatDate(token.updatedAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
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