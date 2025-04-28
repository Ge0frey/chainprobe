import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  RiAlertLine,
  RiBarChartBoxLine,
  RiTimeLine,
  RiExchangeLine,
  RiSearchEyeLine,
  RiPulseLine,
  RiSearchLine,
  RiShieldLine,
  RiRadarLine
} from 'react-icons/ri';
import { detectTransactionPatterns, generateRiskReport } from '../services/patternDetection';
import { Spinner } from './ui/Spinner';
import { getComprehensiveRiskAnalysis } from '../services/webacy';
import { WebacyBranding } from './ui/WebacyBranding';

const severityColors = {
  low: {
    bg: 'bg-blue-900/20',
    text: 'text-blue-400',
    border: 'border-blue-700/30',
    icon: 'text-blue-500',
    glow: 'shadow-blue-500/10'
  },
  medium: {
    bg: 'bg-yellow-900/20',
    text: 'text-yellow-400',
    border: 'border-yellow-700/30',
    icon: 'text-yellow-500',
    glow: 'shadow-yellow-500/10'
  },
  high: {
    bg: 'bg-red-900/20',
    text: 'text-red-400',
    border: 'border-red-700/30',
    icon: 'text-red-500',
    glow: 'shadow-red-500/20'
  }
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

  const { 
    data: webacyRisk, 
    isLoading: webacyLoading 
  } = useQuery({
    queryKey: ['webacy-risk', currentAddress],
    queryFn: () => currentAddress ? getComprehensiveRiskAnalysis(currentAddress) : null,
    enabled: !!currentAddress
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchAddress) {
      setCurrentAddress(searchAddress);
    }
  };

  const isLoading = patternsLoading || reportLoading || webacyLoading;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h2 className="text-3xl font-bold gradient-text">Pattern Analysis</h2>
          <p className="text-gray-400 mt-1">
            Detect suspicious transaction patterns and analyze risk factors
          </p>
        </div>
        
        <div className="flex gap-2 text-sm text-gray-400">
          <RiShieldLine className="text-solana-teal text-lg" />
          <span>Powered by advanced behavioral analysis</span>
        </div>
      </motion.div>

      {/* Search Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-panel p-6"
      >
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="wallet-address" className="block text-sm font-medium text-gray-300 mb-2">
                Wallet Address
              </label>
              <div className="input-with-icon">
                <input
                  type="text"
                  id="wallet-address"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  placeholder="Enter Solana wallet address"
                  className="glass-input w-full text-white"
                />
                <div className="icon">
                  <RiSearchLine className="text-gray-500 text-lg" />
                </div>
              </div>
            </div>
            <div>
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-solana-purple to-solana-teal rounded-lg text-white font-medium hover:shadow-glow transition-all duration-300 flex items-center justify-center gap-2"
              >
                <RiRadarLine className="text-lg" />
                <span>Analyze Patterns</span>
              </button>
            </div>
          </div>
        </form>
      </motion.div>

      {/* Analysis Results */}
      {isLoading ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 glass-panel"
        >
          <Spinner />
          <p className="mt-6 text-gray-400 flex items-center gap-2">
            <RiPulseLine className="text-solana-purple" />
            <span>Analyzing transaction patterns...</span>
          </p>
        </motion.div>
      ) : patterns && riskReport ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Risk Overview */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="glass-panel overflow-hidden h-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <RiShieldLine className="text-solana-purple text-xl" />
                    <span>Risk Assessment</span>
                  </h3>
                  <WebacyBranding size="md" />
                </div>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-300">
                        Overall Risk Score
                      </span>
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.4 }}
                        className={`px-3 py-1 text-sm font-bold rounded-full ${
                          webacyRisk?.overallRiskScore > 0.7 
                            ? severityColors.high.bg + ' ' + severityColors.high.text
                            : webacyRisk?.overallRiskScore > 0.4
                              ? severityColors.medium.bg + ' ' + severityColors.medium.text
                              : severityColors.low.bg + ' ' + severityColors.low.text
                        }`}
                      >
                        {webacyRisk ? `${Math.round(webacyRisk.overallRiskScore * 100)}%` : 'Analyzing...'}
                      </motion.span>
                    </div>
                    
                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(webacyRisk?.overallRiskScore || 0) * 100}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full rounded-full"
                        style={{
                          background: `linear-gradient(90deg, 
                            rgb(20, 241, 149) 0%, 
                            rgb(255, 159, 28) 50%, 
                            rgb(239, 68, 68) 100%
                          )`
                        }}
                      />
                    </div>
                  </div>

                  {/* Webacy Risk Factors */}
                  {webacyRisk && (
                    <div className="space-y-4">
                      {webacyRisk.threatRisks?.details?.map((detail, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`p-3 rounded-lg ${
                            detail.severity === 'high' ? severityColors.high.bg :
                            detail.severity === 'medium' ? severityColors.medium.bg :
                            severityColors.low.bg
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <RiAlertLine className={
                              detail.severity === 'high' ? severityColors.high.text :
                              detail.severity === 'medium' ? severityColors.medium.text :
                              severityColors.low.text
                            } />
                            <span className="font-medium">{detail.category}</span>
                          </div>
                          <p className="text-sm text-gray-300">{detail.description}</p>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Pattern-based Risk Factors */}
                  {riskReport && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium mb-4">Pattern Analysis</h4>
                      <div className="space-y-4">
                        {riskReport.riskFactors.map((factor, index) => (
                          <motion.div 
                            key={index} 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 + (index * 0.1) }}
                            className="glass-card p-4"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-white">
                                {factor.name}
                              </span>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                factor.score > 0.7 
                                  ? severityColors.high.bg + ' ' + severityColors.high.text
                                  : factor.score > 0.4
                                    ? severityColors.medium.bg + ' ' + severityColors.medium.text
                                    : severityColors.low.bg + ' ' + severityColors.low.text
                              }`}>
                                {Math.round(factor.score * 100)}%
                              </span>
                            </div>
                            <p className="text-xs text-gray-400">
                              {factor.description}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {riskReport.recommendations.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.8 }}
                      className="mt-6"
                    >
                      <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                        <RiAlertLine className="text-yellow-400" />
                        <span>Recommendations</span>
                      </h4>
                      <ul className="space-y-3">
                        {riskReport.recommendations.map((rec, index) => (
                          <motion.li 
                            key={index} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.9 + (index * 0.1) }}
                            className="flex items-start gap-3 glass-card p-3"
                          >
                            <div className="bg-yellow-900/20 p-1.5 rounded-lg">
                              <RiAlertLine className="text-yellow-500 text-sm" />
                            </div>
                            <span className="text-sm text-gray-300">{rec}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Detected Patterns */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="glass-panel overflow-hidden h-full">
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <RiRadarLine className="text-solana-teal text-xl" />
                  <span>Detected Patterns</span>
                </h3>
                <div className="space-y-5">
                  {patterns.length > 0 ? (
                    patterns.map((pattern, index) => {
                      const Icon = patternIcons[pattern.type as keyof typeof patternIcons] || RiAlertLine;
                      const colors = severityColors[pattern.severity];
                      
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                          className={`glass-card p-5 border ${colors.border} ${colors.glow}`}
                        >
                          <div className="flex gap-4">
                            <div className={`p-3 rounded-xl ${colors.bg} self-start`}>
                              <Icon className={`w-6 h-6 ${colors.icon}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-base font-bold text-white">
                                  {pattern.type.replace(/_/g, ' ')}
                                </h4>
                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${colors.bg} ${colors.text}`}>
                                  {pattern.severity.toUpperCase()}
                                </span>
                              </div>
                              <p className="mb-4 text-gray-400 text-sm">
                                {pattern.description}
                              </p>
                              
                              <div className="mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                                  <span className="font-medium">Confidence</span>
                                  <span className="text-white text-sm">{Math.round(pattern.confidence * 100)}%</span>
                                </div>
                                <div className="w-full bg-gray-800 rounded-full h-1.5">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pattern.confidence * 100}%` }}
                                    transition={{ duration: 0.8, delay: 0.5 + index * 0.1 }}
                                    className={`h-1.5 rounded-full ${
                                      pattern.severity === 'high' ? 'bg-red-500' : 
                                      pattern.severity === 'medium' ? 'bg-yellow-500' : 
                                      'bg-blue-500'
                                    }`}
                                  />
                                </div>
                              </div>
                              
                              {pattern.metadata && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                                  {Object.entries(pattern.metadata).map(([key, value], i) => (
                                    <motion.div 
                                      key={key} 
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: 0.7 + i * 0.05 }}
                                      className={`text-sm p-2 rounded-lg ${colors.bg} border ${colors.border}`}
                                    >
                                      <span className="block text-xs text-gray-400 mb-1">
                                        {key.replace(/_/g, ' ')}
                                      </span>
                                      <span className={`font-medium ${colors.text}`}>
                                        {typeof value === 'number' ? value.toLocaleString() : value.toString()}
                                      </span>
                                    </motion.div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-center py-12 glass-card flex flex-col items-center"
                    >
                      <div className="bg-blue-900/20 p-4 rounded-full mb-4">
                        <RiSearchEyeLine className="h-12 w-12 text-blue-500" />
                      </div>
                      <h3 className="mt-2 text-lg font-bold text-white">No Patterns Detected</h3>
                      <p className="mt-2 text-sm text-gray-400 max-w-md mx-auto">
                        No suspicious patterns were detected in the transaction history for this address. This could indicate normal activity or insufficient data.
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-10"
        >
          <div className="glass-panel rounded-xl p-8">
            <RiRadarLine className="text-solana-purple/50 text-6xl mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Enter a wallet address to analyze transaction patterns</p>
          </div>
        </motion.div>
      )}
    </div>
  );
} 