import { useState, useEffect } from 'react';
import { RiSearchLine, RiAlertLine, RiShieldCheckLine } from 'react-icons/ri';
import axios from 'axios';

import { NewTokensSection } from './NewTokensSection';
import { TrendingTokensSection } from './TrendingTokensSection';
import { VerifiedTokensSection } from './VerifiedTokensSection';
import type { TokenReport, NewToken, TrendingToken, VerifiedToken } from './types';

const API_BASE_URL = 'https://api.rugcheck.xyz/v1';

// Utility function for risk color
const getRiskColor = (score: number) => {
  if (score <= 30) return 'text-green-500';
  if (score <= 60) return 'text-yellow-500';
  return 'text-red-500';
};

export default function RugCheck() {
  const [tokenAddress, setTokenAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<TokenReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newTokens, setNewTokens] = useState<NewToken[]>([]);
  const [trendingTokens, setTrendingTokens] = useState<TrendingToken[]>([]);
  const [verifiedTokens, setVerifiedTokens] = useState<VerifiedToken[]>([]);

  // Fetch token data
  const fetchTokenData = async () => {
    if (!tokenAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch summary first for quick feedback
      const summaryResponse = await axios.get(`${API_BASE_URL}/tokens/${tokenAddress}/report/summary`);
      
      // If summary looks good, fetch full report
      if (summaryResponse.data) {
        const reportResponse = await axios.get(`${API_BASE_URL}/tokens/${tokenAddress}/report`);
        setReport(reportResponse.data);
      }
    } catch (err) {
      setError('Failed to fetch token data. Please check the token address and try again.');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats data
  const fetchStats = async () => {
    try {
      const [newTokensRes, trendingRes, verifiedRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/stats/new_tokens`),
        axios.get(`${API_BASE_URL}/stats/trending`),
        axios.get(`${API_BASE_URL}/stats/verified`)
      ]);

      setNewTokens(newTokensRes.data);
      setTrendingTokens(trendingRes.data);
      setVerifiedTokens(verifiedRes.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  // Fetch stats on component mount
  useEffect(() => {
    fetchStats();
  }, []);

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

      {/* Token Report */}
      {report && (
        <div className="space-y-6 mb-8">
          {/* Token Overview */}
          <div className="glass-panel p-6">
            <h2 className="text-xl font-semibold mb-4">Token Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Name</p>
                <p className="font-semibold">
                  {report.verification?.name || report.tokenMeta?.name || 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Symbol</p>
                <p className="font-semibold">
                  {report.verification?.symbol || report.tokenMeta?.symbol || 'Unknown'}
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
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="glass-panel p-6">
            <h2 className="text-xl font-semibold mb-4">Risk Assessment</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Overall Risk Score</p>
                <p className={`text-2xl font-bold ${getRiskColor(report.score_normalised || 0)}`}>
                  {report.score_normalised || 0}/100
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {report.rugged ? 'RUG DETECTED' : 'No rug detected'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Verification Status</p>
                <div className="flex items-center mt-2">
                  {report.verification?.jup_verified ? (
                    <span className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                      <RiShieldCheckLine className="mr-1" /> Verified
                    </span>
                  ) : (
                    <span className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                      <RiAlertLine className="mr-1" /> Unverified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Risk Indicators */}
          {report.risks && report.risks.length > 0 && (
            <div className="glass-panel p-6">
              <h2 className="text-xl font-semibold mb-4">Risk Indicators</h2>
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
                      <div>
                        <h3 className="font-semibold">{risk.name}</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          {risk.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <NewTokensSection tokens={newTokens} />
        <TrendingTokensSection tokens={trendingTokens} />
        <VerifiedTokensSection tokens={verifiedTokens} />
      </div>
    </div>
  );
} 