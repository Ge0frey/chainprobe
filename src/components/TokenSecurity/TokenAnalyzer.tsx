import { useState } from 'react';
import { 
  RiAlertLine, 
  RiShieldCheckLine, 
  RiShieldCrossLine, 
  RiInformationLine, 
  RiExternalLinkLine, 
  RiUser3Line,
  RiCoinsLine,
  RiLockLine,
  RiCalendarLine,
  RiPercentLine
} from 'react-icons/ri';
import axios from 'axios';
import { Spinner } from '../ui/Spinner';

const API_BASE_URL = 'https://api.rugcheck.xyz/v1';

// Comprehensive token report interface based on API response
interface TokenReport {
  mint: string;
  tokenProgram: string;
  token: {
    mintAuthority: string | null;
    supply: number;
    decimals: number;
    isInitialized: boolean;
    freezeAuthority: string | null;
  };
  tokenMeta: {
    name: string;
    symbol: string;
    uri: string;
    mutable: boolean;
    updateAuthority: string;
  };
  fileMeta?: {
    description: string;
    image: string;
    name: string;
    symbol: string;
  };
  totalHolders: number;
  price: number;
  score: number;
  score_normalised: number;
  risks: {
    name: string;
    value: string;
    description: string;
    score: number;
    level: string;
  }[];
  verification: {
    mint: string;
    name: string;
    symbol: string;
    jup_verified: boolean;
    jup_strict: boolean;
    description: string;
    links?: { provider: string; value: string; }[];
    payer?: string;
  };
  creator?: string;
  creatorTokens?: {
    createdAt: string;
    marketCap: number;
    mint: string;
  }[];
  detectedAt?: string;
  graphInsidersDetected?: number;
  insiderNetworks?: {
    activeAccounts: number;
    id: string;
    size: number;
    tokenAmount: number;
    type: string;
  }[];
  knownAccounts?: Record<string, { name: string; type: string; }>;
  lockers?: Record<string, {
    owner: string;
    programID: string;
    tokenAccount: string;
    type: string;
    unlockDate: number;
    uri: string;
    usdcLocked: number;
  }>;
  lockerOwners?: Record<string, boolean>;
  markets?: {
    liquidityA: string;
    liquidityAAccount: string;
    liquidityB: string;
    liquidityBAccount: string;
    lp: {
      base: number;
      baseMint: string;
      basePrice: number;
      baseUSD: number;
      currentSupply: number;
      holders: Holder[];
      lpCurrentSupply: number;
      lpLocked: number;
      lpLockedPct: number;
      lpLockedUSD: number;
      lpMaxSupply: number;
      lpMint: string;
      lpTotalSupply: number;
      lpUnlocked: number;
      pctReserve: number;
      pctSupply: number;
      quote: number;
      quoteMint: string;
      quotePrice: number;
      quoteUSD: number;
      reserveSupply: number;
      tokenSupply: number;
      totalTokensUnlocked: number;
    };
    marketType: string;
    mintA: string;
    mintAAccount: string;
    mintB: string;
    mintBAccount: string;
    mintLP: string;
    mintLPAccount: string;
    pubkey: string;
  }[];
  tokenType?: string;
  token_extensions?: string;
  transferFee?: {
    authority: string;
    maxAmount: number;
    pct: number;
  };
  events?: {
    createdAt: string;
    event: number;
    newValue: string;
    oldValue: string;
  }[];
  topHolders?: Holder[];
  totalLPProviders?: number;
  totalMarketLiquidity: number;
  rugged: boolean;
}

interface Holder {
  address: string;
  amount: number;
  decimals: number;
  insider: boolean;
  owner: string;
  pct: number;
  uiAmount: number;
  uiAmountString: string;
}

// Utility function for risk color
const getRiskColor = (score: number) => {
  if (score <= 30) return 'text-green-500';
  if (score <= 60) return 'text-yellow-500';
  return 'text-red-500';
};

// Function to shorten the address for display
const shortenAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
};

export default function TokenAnalyzer() {
  const [tokenAddress, setTokenAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<TokenReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch token data
  const fetchTokenData = async () => {
    if (!tokenAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch full report directly
      const reportResponse = await axios.get<TokenReport>(`${API_BASE_URL}/tokens/${tokenAddress}/report`);
      setReport(reportResponse.data);
      setActiveTab('overview');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch token data. Please check the token address and try again.');
      setReport(null);
    } finally {
      setLoading(false);
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

  const formatPercentage = (value: number | undefined) => {
    if (typeof value === 'undefined' || value === null) return '0%';
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatDate = (timestamp: number | string | undefined) => {
    if (!timestamp) return 'Unknown';
    const date = typeof timestamp === 'number' 
      ? new Date(timestamp * 1000) 
      : new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 gradient-text">Token Security Analysis</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Analyze tokens for potential risks and get detailed security reports.
        </p>
      </div>

      {/* Search Input */}
      <div className="mb-8">
        <div className="input-with-icon">
          <input
            type="text"
            placeholder="Enter token mint address..."
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            className="search-input"
          />
          <button
            onClick={fetchTokenData}
            disabled={loading}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 gradient-button"
          >
            {loading ? 'Loading...' : 'Analyze'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400">
          <RiAlertLine className="inline-block mr-2" />
          {error}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Analyzing token security...</p>
        </div>
      )}

      {/* Token Report */}
      {report && !loading && (
        <div className="space-y-6 mb-8">
          {/* Navigation Tabs */}
          <div className="bg-white/5 dark:bg-black/10 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="flex flex-wrap">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-3 text-sm font-medium ${
                  activeTab === 'overview'
                    ? 'bg-solana-purple/10 text-solana-purple border-b-2 border-solana-purple'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-black/20'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('risks')}
                className={`px-4 py-3 text-sm font-medium ${
                  activeTab === 'risks'
                    ? 'bg-solana-purple/10 text-solana-purple border-b-2 border-solana-purple'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-black/20'
                }`}
              >
                Risks
              </button>
              {report.topHolders && report.topHolders.length > 0 && (
                <button
                  onClick={() => setActiveTab('holders')}
                  className={`px-4 py-3 text-sm font-medium ${
                    activeTab === 'holders'
                      ? 'bg-solana-purple/10 text-solana-purple border-b-2 border-solana-purple'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-black/20'
                  }`}
                >
                  Holders
                </button>
              )}
              {report.markets && report.markets.length > 0 && (
                <button
                  onClick={() => setActiveTab('markets')}
                  className={`px-4 py-3 text-sm font-medium ${
                    activeTab === 'markets'
                      ? 'bg-solana-purple/10 text-solana-purple border-b-2 border-solana-purple'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-black/20'
                  }`}
                >
                  Markets
                </button>
              )}
              {Object.keys(report.lockers || {}).length > 0 && (
                <button
                  onClick={() => setActiveTab('liquidity')}
                  className={`px-4 py-3 text-sm font-medium ${
                    activeTab === 'liquidity'
                      ? 'bg-solana-purple/10 text-solana-purple border-b-2 border-solana-purple'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-black/20'
                  }`}
                >
                  Liquidity
                </button>
              )}
              <button
                onClick={() => setActiveTab('details')}
                className={`px-4 py-3 text-sm font-medium ${
                  activeTab === 'details'
                    ? 'bg-solana-purple/10 text-solana-purple border-b-2 border-solana-purple'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-black/20'
                }`}
              >
                Details
              </button>
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Token Overview */}
              <div className="glass-panel p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Token Overview</h2>
                  {report.rugged && (
                    <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-sm font-bold">
                      RUG DETECTED
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Name</p>
                    <p className="font-semibold">
                      {report.verification?.name || report.tokenMeta?.name || report.fileMeta?.name || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Symbol</p>
                    <p className="font-semibold">
                      {report.verification?.symbol || report.tokenMeta?.symbol || report.fileMeta?.symbol || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Mint Address</p>
                    <p className="font-semibold text-xs md:text-sm break-all flex items-center gap-1">
                      {report.mint}
                      <a 
                        href={`https://solscan.io/token/${report.mint}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-solana-teal hover:underline"
                      >
                        <RiExternalLinkLine />
                      </a>
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Total Supply</p>
                    <p className="font-semibold">{formatNumber(report.token?.supply)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Market Liquidity</p>
                    <p className="font-semibold">{formatPrice(report.totalMarketLiquidity)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Price</p>
                    <p className="font-semibold">{formatPrice(report.price)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Total Holders</p>
                    <p className="font-semibold">{formatNumber(report.totalHolders)}</p>
                  </div>
                  {report.detectedAt && (
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Detected At</p>
                      <p className="font-semibold">{formatDate(report.detectedAt)}</p>
                    </div>
                  )}
                  {report.tokenType && (
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Token Type</p>
                      <p className="font-semibold">{report.tokenType}</p>
                    </div>
                  )}
                </div>

                {/* Description if available */}
                {(report.verification?.description || report.fileMeta?.description) && (
                  <div className="mt-6 p-4 bg-white/5 dark:bg-black/10 rounded-lg">
                    <p className="text-gray-600 dark:text-gray-400 mb-2">Description</p>
                    <p className="text-sm">
                      {report.verification?.description || report.fileMeta?.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Risk Assessment */}
              <div className="glass-panel p-6">
                <h2 className="text-xl font-semibold mb-4">Risk Assessment</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <p className="text-gray-600 dark:text-gray-400">Overall Risk Score</p>
                    <div className="mt-2 flex items-center">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                        <div 
                          className={`h-4 rounded-full ${
                            report.score_normalised <= 30 ? 'bg-green-500' :
                            report.score_normalised <= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${report.score_normalised}%` }}
                        ></div>
                      </div>
                      <p className={`ml-3 font-bold ${getRiskColor(report.score_normalised || 0)}`}>
                        {report.score_normalised || 0}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {report.score_normalised <= 30 ? 'Low Risk' :
                       report.score_normalised <= 60 ? 'Medium Risk' : 'High Risk'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Verification Status</p>
                    <div className="flex items-center mt-2">
                      {report.verification?.jup_verified ? (
                        <span className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                          <RiShieldCheckLine className="mr-1" /> Jupiter Verified
                        </span>
                      ) : (
                        <span className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                          <RiShieldCrossLine className="mr-1" /> Not Verified
                        </span>
                      )}
                    </div>
                    {report.verification?.jup_strict && (
                      <div className="flex items-center mt-2">
                        <span className="bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                          <RiShieldCheckLine className="mr-1" /> Jupiter Strict Mode
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Risk Indicators Preview */}
                {report.risks && report.risks.length > 0 && (
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-gray-600 dark:text-gray-400">Top Risk Indicators</p>
                      <button 
                        onClick={() => setActiveTab('risks')}
                        className="text-sm text-solana-purple hover:underline"
                      >
                        View All
                      </button>
                    </div>
                    <div className="space-y-2">
                      {report.risks.slice(0, 3).map((risk, index) => (
                        <div
                          key={index}
                          className="p-3 bg-white/5 dark:bg-black/10 rounded-lg border border-gray-200 dark:border-gray-800"
                        >
                          <div className="flex items-center gap-2">
                            <div className={
                              risk.level === 'high' || risk.level === 'danger' ? 'text-red-500' :
                              risk.level === 'medium' || risk.level === 'warn' ? 'text-yellow-500' :
                              'text-green-500'
                            }>
                              <RiAlertLine className="text-lg" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{risk.name}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Creator Information */}
              {report.creator && (
                <div className="glass-panel p-6">
                  <h2 className="text-xl font-semibold mb-4">Creator Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Creator Address</p>
                      <p className="font-semibold text-xs md:text-sm break-all flex items-center gap-1">
                        {report.creator}
                        <a 
                          href={`https://solscan.io/account/${report.creator}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-solana-teal hover:underline"
                        >
                          <RiExternalLinkLine />
                        </a>
                      </p>
                    </div>
                    {report.creatorTokens && report.creatorTokens.length > 0 && (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Other Tokens by Creator</p>
                        <p className="font-semibold">{report.creatorTokens.length} token(s)</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Risks Tab */}
          {activeTab === 'risks' && report.risks && (
            <div className="glass-panel p-6">
              <h2 className="text-xl font-semibold mb-4">Risk Indicators</h2>
              {report.risks.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">No risk indicators found.</p>
              ) : (
                <div className="space-y-4">
                  {report.risks.map((risk, index) => (
                    <div
                      key={index}
                      className="p-4 bg-white/5 dark:bg-black/10 rounded-lg border border-gray-200 dark:border-gray-800"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`mt-1 ${
                          risk.level === 'high' || risk.level === 'danger' ? 'text-red-500' :
                          risk.level === 'medium' || risk.level === 'warn' ? 'text-yellow-500' :
                          'text-green-500'
                        }`}>
                          <RiAlertLine className="text-xl" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold flex items-center gap-2">
                            {risk.name}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              risk.level === 'high' || risk.level === 'danger' 
                                ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
                              risk.level === 'medium' || risk.level === 'warn' 
                                ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' :
                              'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                            }`}>
                              {risk.level.toUpperCase()}
                            </span>
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                            {risk.description}
                          </p>
                          {risk.value && (
                            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                              <code>{risk.value}</code>
                            </div>
                          )}
                        </div>
                        {risk.score !== undefined && (
                          <div className="text-right">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Risk Score</p>
                            <p className={`font-bold ${getRiskColor(risk.score)}`}>{risk.score}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Insider Networks */}
              {report.insiderNetworks && report.insiderNetworks.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Insider Networks</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Network ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Size</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Accounts</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Token Amount</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                        {report.insiderNetworks.map((network, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{network.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{network.type}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{network.size}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{network.activeAccounts}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{formatNumber(network.tokenAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Holders Tab */}
          {activeTab === 'holders' && report.topHolders && (
            <div className="glass-panel p-6">
              <h2 className="text-xl font-semibold mb-4">Top Token Holders</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Address</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Percentage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Insider</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                    {report.topHolders.map((holder, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <a
                            href={`https://solscan.io/account/${holder.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-solana-purple hover:underline"
                          >
                            {shortenAddress(holder.address)}
                            <RiExternalLinkLine />
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {formatNumber(holder.uiAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {formatPercentage(holder.pct)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {holder.insider ? (
                            <span className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full text-xs">
                              Yes
                            </span>
                          ) : (
                            <span className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full text-xs">
                              No
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {report.totalHolders && (
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  Showing top holders out of {formatNumber(report.totalHolders)} total holders.
                </p>
              )}
            </div>
          )}

          {/* Markets Tab */}
          {activeTab === 'markets' && report.markets && (
            <div className="glass-panel p-6">
              <h2 className="text-xl font-semibold mb-4">Markets</h2>
              {report.markets.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">No markets found for this token.</p>
              ) : (
                <div className="space-y-6">
                  {report.markets.map((market, idx) => (
                    <div key={idx} className="p-4 bg-white/5 dark:bg-black/10 rounded-lg border border-gray-200 dark:border-gray-800">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        {market.marketType}
                        <a
                          href={`https://solscan.io/account/${market.pubkey}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-solana-purple hover:underline flex items-center gap-1"
                        >
                          {shortenAddress(market.pubkey)}
                          <RiExternalLinkLine />
                        </a>
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Liquidity</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">Base Liquidity</span>
                              <span className="text-sm font-medium">{market.liquidityA}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Quote Liquidity</span>
                              <span className="text-sm font-medium">{market.liquidityB}</span>
                            </div>
                          </div>
                        </div>
                        
                        {market.lp && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">LP Info</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm">LP Supply</span>
                                <span className="text-sm font-medium">{formatNumber(market.lp.lpTotalSupply)}</span>
                              </div>
                              {market.lp.lpLockedPct !== undefined && (
                                <div className="flex justify-between">
                                  <span className="text-sm">LP Locked</span>
                                  <span className="text-sm font-medium">{formatPercentage(market.lp.lpLockedPct)}</span>
                                </div>
                              )}
                              {market.lp.baseUSD !== undefined && (
                                <div className="flex justify-between">
                                  <span className="text-sm">Base Value</span>
                                  <span className="text-sm font-medium">{formatPrice(market.lp.baseUSD)}</span>
                                </div>
                              )}
                              {market.lp.quoteUSD !== undefined && (
                                <div className="flex justify-between">
                                  <span className="text-sm">Quote Value</span>
                                  <span className="text-sm font-medium">{formatPrice(market.lp.quoteUSD)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Liquidity Tab */}
          {activeTab === 'liquidity' && report.lockers && (
            <div className="glass-panel p-6">
              <h2 className="text-xl font-semibold mb-4">Liquidity Lockers</h2>
              {Object.keys(report.lockers).length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">No liquidity lockers found for this token.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Locker</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Value Locked</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unlock Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Owner</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                      {Object.entries(report.lockers).map(([address, locker], idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <a
                              href={`https://solscan.io/account/${address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-solana-purple hover:underline"
                            >
                              {shortenAddress(address)}
                              <RiExternalLinkLine />
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{locker.type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{formatPrice(locker.usdcLocked)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(locker.unlockDate)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <a
                              href={`https://solscan.io/account/${locker.owner}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-solana-purple hover:underline"
                            >
                              {shortenAddress(locker.owner)}
                              <RiExternalLinkLine />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="glass-panel p-6">
              <h2 className="text-xl font-semibold mb-4">Technical Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-md font-medium mb-3">Token Program</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Program ID</p>
                      <p className="font-semibold text-xs md:text-sm break-all flex items-center gap-1">
                        {report.tokenProgram}
                        <a 
                          href={`https://solscan.io/account/${report.tokenProgram}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-solana-teal hover:underline"
                        >
                          <RiExternalLinkLine />
                        </a>
                      </p>
                    </div>
                    {report.tokenType && (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Token Type</p>
                        <p className="font-semibold">{report.tokenType}</p>
                      </div>
                    )}
                    {report.token_extensions && (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Extensions</p>
                        <p className="font-semibold">{report.token_extensions}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-medium mb-3">Token Authorities</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Mint Authority</p>
                      {report.token?.mintAuthority ? (
                        <p className="font-semibold text-xs md:text-sm break-all flex items-center gap-1">
                          {report.token.mintAuthority}
                          <a 
                            href={`https://solscan.io/account/${report.token.mintAuthority}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-solana-teal hover:underline"
                          >
                            <RiExternalLinkLine />
                          </a>
                        </p>
                      ) : (
                        <p className="text-green-500 font-medium">No mint authority (burned)</p>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Freeze Authority</p>
                      {report.token?.freezeAuthority ? (
                        <p className="font-semibold text-xs md:text-sm break-all flex items-center gap-1">
                          {report.token.freezeAuthority}
                          <a 
                            href={`https://solscan.io/account/${report.token.freezeAuthority}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-solana-teal hover:underline"
                          >
                            <RiExternalLinkLine />
                          </a>
                        </p>
                      ) : (
                        <p className="text-green-500 font-medium">No freeze authority</p>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Update Authority</p>
                      {report.tokenMeta?.updateAuthority ? (
                        <p className="font-semibold text-xs md:text-sm break-all flex items-center gap-1">
                          {report.tokenMeta.updateAuthority}
                          <a 
                            href={`https://solscan.io/account/${report.tokenMeta.updateAuthority}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-solana-teal hover:underline"
                          >
                            <RiExternalLinkLine />
                          </a>
                        </p>
                      ) : (
                        <p className="text-gray-500 font-medium">None</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Transfer Fee */}
              {report.transferFee && (
                <div className="mt-6">
                  <h3 className="text-md font-medium mb-3">Transfer Fee</h3>
                  <div className="p-4 bg-white/5 dark:bg-black/10 rounded-lg border border-gray-200 dark:border-gray-800">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Fee Percentage</p>
                        <p className="font-semibold">{formatPercentage(report.transferFee.pct)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Max Amount</p>
                        <p className="font-semibold">{formatNumber(report.transferFee.maxAmount)}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Fee Authority</p>
                        <p className="font-semibold text-xs md:text-sm break-all flex items-center gap-1">
                          {report.transferFee.authority}
                          <a 
                            href={`https://solscan.io/account/${report.transferFee.authority}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-solana-teal hover:underline"
                          >
                            <RiExternalLinkLine />
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Metadata Links */}
              {report.verification?.links && report.verification.links.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-md font-medium mb-3">Official Links</h3>
                  <div className="flex flex-wrap gap-2">
                    {report.verification.links.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white/10 dark:bg-black/20 text-solana-purple hover:underline px-3 py-1 rounded-full text-sm flex items-center gap-1"
                      >
                        <RiExternalLinkLine /> {link.provider}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Token Events */}
              {report.events && report.events.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-md font-medium mb-3">Token Events</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Event</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Old Value</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">New Value</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                        {report.events.map((event, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(event.createdAt)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{event.event}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{event.oldValue}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{event.newValue}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 