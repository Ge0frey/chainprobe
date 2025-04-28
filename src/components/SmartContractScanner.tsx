import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { RiShieldCheckLine, RiAlertLine, RiFileCodeLine, RiTimeLine } from 'react-icons/ri';
import { Spinner } from './ui/Spinner';
import { WebacyBranding } from './ui/WebacyBranding';
import { getComprehensiveRiskAnalysis, getContractRisk } from '../services/webacy';

interface ContractRisk {
  address: string;
  riskLevel: 'low' | 'medium' | 'high';
  findings: {
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    evidence: string[];
  }[];
  interactionCount: number;
  lastInteraction: string;
  totalValue: number;
}

export default function SmartContractScanner() {
  const [searchAddress, setSearchAddress] = useState('');
  const [selectedContract, setSelectedContract] = useState<ContractRisk | null>(null);

  // Query for contract risks using Webacy
  const { 
    data: contractRisks,
    isLoading: contractsLoading,
    error: contractsError
  } = useQuery({
    queryKey: ['contract-risks', searchAddress],
    queryFn: async () => {
      if (!searchAddress) return [];
      const risk = await getContractRisk(searchAddress);
      return [{
        address: searchAddress,
        riskLevel: risk.riskScore > 0.7 ? 'high' : risk.riskScore > 0.3 ? 'medium' : 'low',
        findings: risk.analysis.map(a => ({
          type: a.category,
          description: a.findings[0] || '',
          severity: a.severity,
          evidence: a.findings
        })),
        interactionCount: 0, // This would come from additional data
        lastInteraction: new Date().toISOString(),
        totalValue: 0 // This would come from additional data
      }];
    },
    enabled: !!searchAddress
  });

  // Query for comprehensive risk analysis
  const {
    data: riskAnalysis,
    isLoading: riskLoading
  } = useQuery({
    queryKey: ['risk-analysis', selectedContract?.address],
    queryFn: () => selectedContract ? getComprehensiveRiskAnalysis(selectedContract.address) : null,
    enabled: !!selectedContract
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchAddress) {
      setSelectedContract(null);
    }
  };

  const loading = contractsLoading || riskLoading;

  const getRiskColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low':
        return 'text-green-500';
      case 'medium':
        return 'text-yellow-500';
      case 'high':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-solana-purple to-solana-teal bg-clip-text text-transparent">
            Smart Contract Risk Scanner
          </h1>
          <p className="text-muted-foreground">
            Analyze smart contracts for potential vulnerabilities and suspicious patterns
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              placeholder="Enter wallet address or contract ID"
              className="flex-1 glass-input"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-solana-purple to-solana-teal text-white rounded-lg font-semibold hover:shadow-glow transition-all"
            >
              Scan Contracts
            </button>
          </div>
        </form>

        {/* Results Section */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner />
          </div>
        ) : contractRisks?.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contract List */}
            <div className="lg:col-span-1">
              <div className="glass-panel p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Analyzed Contracts</h2>
                  <WebacyBranding size="sm" />
                </div>
                <div className="space-y-4">
                  {contractRisks.map((contract) => (
                    <motion.div
                      key={contract.address}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedContract(contract)}
                      className={`p-4 rounded-lg cursor-pointer transition-all ${
                        selectedContract?.address === contract.address
                          ? 'bg-card/50 border border-solana-purple/50'
                          : 'bg-card/30 border border-border hover:border-solana-purple/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <RiFileCodeLine className="text-xl text-solana-purple" />
                          <span className="font-mono text-sm truncate">
                            {contract.address.slice(0, 8)}...{contract.address.slice(-6)}
                          </span>
                        </div>
                        <span className={`text-sm font-semibold ${getRiskColor(contract.riskLevel)}`}>
                          {contract.riskLevel.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {contract.findings.length} findings
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Contract Details */}
            <div className="lg:col-span-2">
              {selectedContract ? (
                <div className="glass-panel p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Contract Details</h2>
                    <WebacyBranding size="md" />
                  </div>

                  {/* Risk Score Section */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Risk Score</span>
                      <span className={`font-medium ${
                        (riskAnalysis?.overallRiskScore ?? 0) > 0.7 ? 'text-red-500' : 
                        (riskAnalysis?.overallRiskScore ?? 0) > 0.3 ? 'text-yellow-500' : 
                        'text-green-500'
                      }`}>
                        {riskAnalysis ? `${(riskAnalysis.overallRiskScore * 100).toFixed(0)}%` : 'Analyzing...'}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-300"
                        style={{ 
                          width: `${(riskAnalysis?.overallRiskScore || 0) * 100}%`,
                          background: `linear-gradient(90deg, rgb(20, 241, 149), rgb(255, 159, 28), rgb(239, 68, 68))`
                        }}
                      />
                    </div>
                  </div>

                  {/* Risk Factors Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="glass-card p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <RiShieldCheckLine className="text-xl text-solana-purple" />
                        <span className="text-sm font-semibold">Contract Safety</span>
                      </div>
                      <span className={`text-lg font-bold ${
                        (riskAnalysis?.contractRisk?.riskScore ?? 0) > 0.7 ? 'text-red-500' :
                        (riskAnalysis?.contractRisk?.riskScore ?? 0) > 0.3 ? 'text-yellow-500' :
                        'text-green-500'
                      }`}>
                        {riskAnalysis?.contractRisk ? 
                          `${(riskAnalysis.contractRisk.riskScore * 100).toFixed(0)}%` : 
                          'Analyzing...'}
                      </span>
                    </div>

                    <div className="glass-card p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <RiAlertLine className="text-xl text-solana-teal" />
                        <span className="text-sm font-semibold">Threat Level</span>
                      </div>
                      <span className={`text-lg font-bold ${
                        (riskAnalysis?.threatRisks?.riskScore ?? 0) > 0.7 ? 'text-red-500' :
                        (riskAnalysis?.threatRisks?.riskScore ?? 0) > 0.3 ? 'text-yellow-500' :
                        'text-green-500'
                      }`}>
                        {riskAnalysis?.threatRisks ? 
                          `${(riskAnalysis.threatRisks.riskScore * 100).toFixed(0)}%` : 
                          'Analyzing...'}
                      </span>
                    </div>

                    <div className="glass-card p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <RiTimeLine className="text-xl text-solana-purple" />
                        <span className="text-sm font-semibold">Exposure Risk</span>
                      </div>
                      <span className={`text-lg font-bold ${
                        (riskAnalysis?.exposureRisk?.exposureScore ?? 0) > 0.7 ? 'text-red-500' :
                        (riskAnalysis?.exposureRisk?.exposureScore ?? 0) > 0.3 ? 'text-yellow-500' :
                        'text-green-500'
                      }`}>
                        {riskAnalysis?.exposureRisk ? 
                          `${(riskAnalysis.exposureRisk.exposureScore * 100).toFixed(0)}%` : 
                          'Analyzing...'}
                      </span>
                    </div>
                  </div>

                  {/* Security Findings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-2">Security Findings</h3>
                    {riskAnalysis?.contractRisk?.analysis.map((finding, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass-card p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{finding.category}</span>
                          <span className={`text-sm px-2 py-1 rounded-full ${
                            finding.severity === 'high' ? 'bg-red-500/20 text-red-500' :
                            finding.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                            'bg-green-500/20 text-green-500'
                          }`}>
                            {finding.severity}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {finding.findings.map((evidence, i) => (
                            <div key={i} className="text-sm text-muted-foreground">
                              {evidence}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="glass-panel p-6 flex items-center justify-center h-full">
                  <p className="text-muted-foreground">
                    Select a contract to view detailed analysis
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="glass-panel rounded-xl p-8">
              <RiShieldCheckLine className="text-solana-purple/50 text-6xl mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Enter a wallet address or contract ID to scan for vulnerabilities</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 