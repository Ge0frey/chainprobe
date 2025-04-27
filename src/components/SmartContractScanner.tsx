import { useState } from 'react';
import { motion } from 'framer-motion';
import { RiShieldCheckLine, RiAlertLine, RiFileCodeLine, RiTimeLine } from 'react-icons/ri';
import { Spinner } from './ui/Spinner';

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
  const [loading, setLoading] = useState(false);
  const [contractRisks, setContractRisks] = useState<ContractRisk[]>([]);
  const [selectedContract, setSelectedContract] = useState<ContractRisk | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulated API call - replace with actual implementation
    setTimeout(() => {
      setContractRisks([
        {
          address: '7YarqNvdS8JNVB9RZ76e1GXkZM5wRxgkjZNRxXfUk1Nb',
          riskLevel: 'high',
          findings: [
            {
              type: 'Unauthorized Withdrawal',
              description: 'Contract allows unauthorized withdrawals under certain conditions',
              severity: 'high',
              evidence: ['Function: withdraw()', 'No owner check implemented']
            },
            {
              type: 'Timestamp Manipulation',
              description: 'Vulnerable to timestamp manipulation attacks',
              severity: 'medium',
              evidence: ['Relies on block.timestamp for critical logic']
            }
          ],
          interactionCount: 1205,
          lastInteraction: '2024-03-15T10:30:00Z',
          totalValue: 50000
        },
      ]);
      setLoading(false);
    }, 1500);
  };

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
        ) : contractRisks.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contract List */}
            <div className="lg:col-span-1">
              <div className="glass-panel p-6">
                <h2 className="text-xl font-semibold mb-4">Analyzed Contracts</h2>
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
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">Contract Details</h2>
                    <p className="font-mono text-sm text-muted-foreground">
                      {selectedContract.address}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="glass-card p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <RiShieldCheckLine className="text-xl text-solana-purple" />
                        <span className="text-sm font-semibold">Risk Level</span>
                      </div>
                      <span className={`text-lg font-bold ${getRiskColor(selectedContract.riskLevel)}`}>
                        {selectedContract.riskLevel.toUpperCase()}
                      </span>
                    </div>

                    <div className="glass-card p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <RiAlertLine className="text-xl text-solana-teal" />
                        <span className="text-sm font-semibold">Interactions</span>
                      </div>
                      <span className="text-lg font-bold">
                        {selectedContract.interactionCount.toLocaleString()}
                      </span>
                    </div>

                    <div className="glass-card p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <RiTimeLine className="text-xl text-solana-purple" />
                        <span className="text-sm font-semibold">Last Activity</span>
                      </div>
                      <span className="text-lg font-bold">
                        {new Date(selectedContract.lastInteraction).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-2">Security Findings</h3>
                    {selectedContract.findings.map((finding, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass-card p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{finding.type}</span>
                          <span className={`text-sm px-2 py-1 rounded-full ${
                            getRiskColor(finding.severity)
                          } bg-opacity-20`}>
                            {finding.severity}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {finding.description}
                        </p>
                        <div className="space-y-1">
                          {finding.evidence.map((item, i) => (
                            <div key={i} className="text-xs font-mono bg-card/30 p-2 rounded">
                              {item}
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