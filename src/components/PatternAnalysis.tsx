import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  RiAlertLine,
  RiBarChartBoxLine,
  RiTimeLine,
  RiExchangeLine,
  RiSearchEyeLine
} from 'react-icons/ri';
import { detectTransactionPatterns, generateRiskReport } from '../services/patternDetection';
import { Spinner } from './ui/Spinner';

const severityColors = {
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100',
  high: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
};

const patternIcons = {
  RAPID_SUCCESSION: RiTimeLine,
  CIRCULAR_TRADING: RiExchangeLine,
  WASH_TRADING: RiBarChartBoxLine,
  LAYERING: RiSearchEyeLine
};

export default function PatternAnalysis() {
  const [searchAddress, setSearchAddress] = useState('');
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);

  const { data: patterns, isLoading: patternsLoading } = useQuery({
    queryKey: ['patterns', currentAddress],
    queryFn: () => currentAddress ? detectTransactionPatterns(currentAddress) : Promise.resolve([]),
    enabled: !!currentAddress
  });

  const { data: riskReport, isLoading: reportLoading } = useQuery({
    queryKey: ['risk-report', currentAddress, patterns],
    queryFn: () => currentAddress && patterns 
      ? generateRiskReport(currentAddress, patterns)
      : Promise.resolve(null),
    enabled: !!currentAddress && !!patterns
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchAddress) {
      setCurrentAddress(searchAddress);
    }
  };

  const isLoading = patternsLoading || reportLoading;

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
            Pattern Analysis
          </h2>
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="wallet-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Wallet Address
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="wallet-address"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  placeholder="Enter Solana wallet address"
                  className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Analyze Patterns
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Analysis Results */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner />
          <p className="ml-3 text-gray-500 dark:text-gray-400">Analyzing transaction patterns...</p>
        </div>
      ) : patterns && riskReport ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Risk Overview */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Risk Assessment
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Overall Risk Score
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        riskReport.overallRiskScore > 0.7 
                          ? severityColors.high
                          : riskReport.overallRiskScore > 0.4
                            ? severityColors.medium
                            : severityColors.low
                      }`}>
                        {Math.round(riskReport.overallRiskScore * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${riskReport.overallRiskScore * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Risk Factors */}
                  <div className="space-y-3">
                    {riskReport.riskFactors.map((factor, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {factor.name}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            factor.score > 0.7 
                              ? severityColors.high
                              : factor.score > 0.4
                                ? severityColors.medium
                                : severityColors.low
                          }`}>
                            {Math.round(factor.score * 100)}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {factor.description}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Recommendations */}
                  {riskReport.recommendations.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Recommendations
                      </h4>
                      <ul className="space-y-2">
                        {riskReport.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start">
                            <RiAlertLine className="mt-1 mr-2 text-amber-500 flex-shrink-0" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Detected Patterns */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Detected Patterns
                </h3>
                <div className="space-y-4">
                  {patterns.length > 0 ? (
                    patterns.map((pattern, index) => {
                      const Icon = patternIcons[pattern.type as keyof typeof patternIcons] || RiAlertLine;
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`border rounded-lg p-4 ${
                            pattern.severity === 'high'
                              ? 'border-red-200 dark:border-red-800'
                              : pattern.severity === 'medium'
                                ? 'border-yellow-200 dark:border-yellow-800'
                                : 'border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          <div className="flex items-start">
                            <div className={`p-2 rounded-lg mr-4 ${
                              pattern.severity === 'high'
                                ? 'bg-red-100 dark:bg-red-900'
                                : pattern.severity === 'medium'
                                  ? 'bg-yellow-100 dark:bg-yellow-900'
                                  : 'bg-blue-100 dark:bg-blue-900'
                            }`}>
                              <Icon className={`w-5 h-5 ${
                                pattern.severity === 'high'
                                  ? 'text-red-600 dark:text-red-400'
                                  : pattern.severity === 'medium'
                                    ? 'text-yellow-600 dark:text-yellow-400'
                                    : 'text-blue-600 dark:text-blue-400'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                  {pattern.type.replace(/_/g, ' ')}
                                </h4>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${severityColors[pattern.severity]}`}>
                                  {pattern.severity.toUpperCase()}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {pattern.description}
                              </p>
                              <div className="mt-2 text-sm">
                                <div className="flex items-center text-gray-500 dark:text-gray-400">
                                  <span className="font-medium mr-2">Confidence:</span>
                                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                    <div
                                      className="bg-blue-600 h-1.5 rounded-full"
                                      style={{ width: `${pattern.confidence * 100}%` }}
                                    />
                                  </div>
                                  <span className="ml-2">{Math.round(pattern.confidence * 100)}%</span>
                                </div>
                              </div>
                              {pattern.metadata && (
                                <div className="mt-2 grid grid-cols-2 gap-4">
                                  {Object.entries(pattern.metadata).map(([key, value]) => (
                                    <div key={key} className="text-sm">
                                      <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {key.replace(/_/g, ' ')}:
                                      </span>
                                      <span className="ml-1 text-gray-500 dark:text-gray-400">
                                        {typeof value === 'number' ? value.toLocaleString() : value.toString()}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6">
                      <RiSearchEyeLine className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No Patterns Detected</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        No suspicious patterns were detected in the transaction history.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
} 