import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { RiShieldCheckLine, RiShieldCrossLine, RiInformationLine, RiExternalLinkLine, RiCheckboxCircleLine } from 'react-icons/ri';
import { Spinner } from '../ui/Spinner';

// Define interface for the actual API response
interface VerifiedTokenResponse {
  mint: string;
  payer: string;
  name: string;
  symbol: string;
  description: string;
  jup_verified: boolean;
  jup_strict: boolean;
  links: {
    provider: string;
    value: string;
  }[] | null;
}

const API_BASE_URL = 'https://api.rugcheck.xyz/v1';

// Function to shorten the address for display
const shortenAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
};

export default function VerifiedTokens() {
  const [verifiedTokens, setVerifiedTokens] = useState<VerifiedTokenResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTokenMint, setExpandedTokenMint] = useState<string | null>(null);

  useEffect(() => {
    const fetchVerifiedTokens = async () => {
      setLoading(true);
      try {
        const response = await axios.get<VerifiedTokenResponse[]>(`${API_BASE_URL}/stats/verified`);
        setVerifiedTokens(response.data);
      } catch (err) {
        setError('Failed to fetch verified tokens');
        console.error('Failed to fetch verified tokens:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVerifiedTokens();
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
        <h1 className="text-3xl font-bold mb-4 gradient-text">Verified Tokens</h1>
        <p className="text-gray-600 dark:text-gray-400">
          View recently verified tokens with confirmed authenticity. Click on a token to see more details.
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
            <RiShieldCheckLine className="text-green-500" />
            Recently Verified
          </h2>
          
          {verifiedTokens.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">No verified tokens available</p>
          ) : (
            <div className="space-y-4">
              {verifiedTokens.map((token, index) => (
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
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{token.name}</p>
                        {token.jup_verified && (
                          <span className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                            <RiCheckboxCircleLine /> Verified
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {token.symbol.toUpperCase()}
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
                    <div className="flex items-center">
                      {token.jup_verified ? (
                        <span className="text-green-500"><RiShieldCheckLine className="text-xl" /></span>
                      ) : (
                        <span className="text-yellow-500"><RiShieldCrossLine className="text-xl" /></span>
                      )}
                    </div>
                  </div>

                  {/* Token Details (Expanded) */}
                  {expandedTokenMint === token.mint && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800"
                    >
                      <div className="space-y-4">
                        {/* Description */}
                        <div>
                          <h3 className="font-medium mb-2">Description</h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-line">
                            {token.description || 'No description available.'}
                          </p>
                        </div>

                        {/* Verification Details */}
                        <div>
                          <h3 className="font-medium mb-2">Verification Details</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="flex flex-col">
                                <span className="text-gray-600 dark:text-gray-400 text-sm">Jupiter Verified</span>
                                <span className={`font-medium ${token.jup_verified ? 'text-green-500' : 'text-yellow-500'} flex items-center gap-1`}>
                                  {token.jup_verified ? (
                                    <>
                                      <RiCheckboxCircleLine /> Yes
                                    </>
                                  ) : (
                                    <>
                                      <RiShieldCrossLine /> No
                                    </>
                                  )}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-gray-600 dark:text-gray-400 text-sm">Jupiter Strict</span>
                                <span className={`font-medium ${token.jup_strict ? 'text-green-500' : 'text-yellow-500'} flex items-center gap-1`}>
                                  {token.jup_strict ? (
                                    <>
                                      <RiCheckboxCircleLine /> Yes
                                    </>
                                  ) : (
                                    <>
                                      <RiShieldCrossLine /> No
                                    </>
                                  )}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex flex-col">
                                <span className="text-gray-600 dark:text-gray-400 text-sm">Mint Address</span>
                                <span className="font-medium text-xs md:text-sm break-all">
                                  {token.mint}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-gray-600 dark:text-gray-400 text-sm">Payer</span>
                                <div className="font-medium text-xs md:text-sm break-all flex items-center gap-1">
                                  {token.payer}
                                  <a 
                                    href={`https://solscan.io/account/${token.payer}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-solana-teal hover:underline inline-flex items-center gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <RiExternalLinkLine />
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Links (if available) */}
                        {token.links && token.links.length > 0 && (
                          <div>
                            <h3 className="font-medium mb-2">Links</h3>
                            <div className="flex flex-wrap gap-2">
                              {token.links.map((link, idx) => (
                                <a
                                  key={idx}
                                  href={link.value}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-white/10 dark:bg-black/20 text-solana-purple hover:underline px-3 py-1 rounded-full text-sm flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <RiExternalLinkLine /> {link.provider}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
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