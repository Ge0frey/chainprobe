import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  RiShieldCheckLine, 
  RiShieldCrossLine, 
  RiInformationLine, 
  RiExternalLinkLine, 
  RiCheckboxCircleLine,
  RiLinksLine,
  RiUserLine,
  RiInformationFill
} from 'react-icons/ri';
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 gradient-text">Verified Tokens</h1>
        <p className="text-gray-600 dark:text-gray-400">
          View recently verified tokens with confirmed authenticity. All token details are displayed for easy viewing.
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
            {verifiedTokens.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8 glass-panel">No verified tokens available</p>
            ) : (
              verifiedTokens.map((token, index) => (
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
                        <RiShieldCheckLine className="text-2xl text-green-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{token.name}</h3>
                          {token.jup_verified && (
                            <span className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                              <RiCheckboxCircleLine /> Verified
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <span className="text-gray-500">{token.symbol.toUpperCase()}</span>
                          <a 
                            href={`https://solscan.io/token/${token.mint}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-solana-purple hover:underline inline-flex items-center gap-1 ml-2"
                          >
                            {shortenAddress(token.mint)}
                            <RiExternalLinkLine />
                          </a>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      {token.jup_verified ? (
                        <span className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-medium">
                          Jupiter Verified
                        </span>
                      ) : (
                        <span className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-3 py-1 rounded-full text-xs font-medium">
                          Unverified
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Token Content */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    {/* Left Column - Description */}
                    <div>
                      <h4 className="font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">Description</h4>
                      <div className="bg-white/5 dark:bg-black/10 p-3 rounded-lg">
                        <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-line">
                          {token.description || 'No description available.'}
                        </p>
                      </div>
                      
                      {/* Links (if available) */}
                      {token.links && token.links.length > 0 && (
                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
                            <RiLinksLine /> Official Links
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {token.links.map((link, idx) => (
                              <a
                                key={idx}
                                href={link.value}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white/10 dark:bg-black/20 text-solana-purple hover:underline px-3 py-1 rounded-full text-xs flex items-center gap-1"
                              >
                                <RiExternalLinkLine /> {link.provider}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Right Column - Verification Details */}
                    <div>
                      <h4 className="font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">Verification Details</h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
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
                        
                        <div>
                          <div className="flex items-center gap-2 text-sm mb-1">
                            <RiUserLine className="text-solana-purple" />
                            <span className="text-gray-600 dark:text-gray-400">Payer</span>
                          </div>
                          <div className="pl-6">
                            <div className="font-medium text-xs break-all flex gap-1 items-center">
                              {token.payer}
                              <a 
                                href={`https://solscan.io/account/${token.payer}`} 
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
                            <RiInformationFill className="text-solana-teal" />
                            <span className="text-gray-600 dark:text-gray-400">Full Mint Address</span>
                          </div>
                          <div className="pl-6">
                            <div className="font-medium text-xs break-all">
                              {token.mint}
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