import { motion } from 'framer-motion';
import { RiShieldLine, RiAlertLine, RiInformationLine, RiBarChartLine, RiExchangeLine, RiTimeLine } from 'react-icons/ri';
import { ThreatRiskResponse, SanctionCheckResponse, ApprovalRiskResponse, ExposureRiskResponse, ContractRiskResponse } from '../../services/webacy';

interface RiskScoreCardProps {
  score: number;
  loading?: boolean;
  details?: {
    category: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }[];
  className?: string;
  threatRisks?: ThreatRiskResponse;
  sanctionChecks?: SanctionCheckResponse;
  approvalRisks?: ApprovalRiskResponse;
  exposureRisk?: ExposureRiskResponse;
  contractRisk?: ContractRiskResponse;
}

interface RiskFactor {
  name: string;
  score: number;
  icon: JSX.Element;
  description: string;
  details: string[];
}

export function RiskScoreCard({ 
  score, 
  loading, 
  details, 
  className = '',
  threatRisks,
  sanctionChecks,
  approvalRisks,
  exposureRisk,
  contractRisk
}: RiskScoreCardProps) {
  const getRiskLevel = (score: number) => {
    if (score <= 0.3) return { 
      text: 'LOW', 
      color: 'text-green-500', 
      bg: 'bg-green-500',
      description: 'This address shows normal transaction patterns and behavior'
    };
    if (score <= 0.7) return { 
      text: 'MEDIUM', 
      color: 'text-yellow-500', 
      bg: 'bg-yellow-500',
      description: 'Some unusual patterns detected - further investigation recommended'
    };
    return { 
      text: 'HIGH', 
      color: 'text-red-500', 
      bg: 'bg-red-500',
      description: 'Multiple high-risk indicators detected - immediate attention required'
    };
  };

  const riskLevel = getRiskLevel(score);

  // Risk factor categories using actual API data
  const riskFactors: RiskFactor[] = [
    {
      name: 'Transaction Patterns',
      score: threatRisks?.riskScore || 0,
      icon: <RiBarChartLine />,
      description: 'Based on transaction frequency and amounts',
      details: threatRisks?.flags || []
    },
    {
      name: 'Interaction Risk',
      score: exposureRisk?.exposureScore || 0,
      icon: <RiExchangeLine />,
      description: 'Based on counterparty risk analysis',
      details: exposureRisk?.riskExposures.map(exposure => `${exposure.type}: ${(exposure.riskScore * 100).toFixed(0)}%`) || []
    },
    {
      name: 'Contract Safety',
      score: contractRisk?.riskScore || 0,
      icon: <RiTimeLine />,
      description: 'Based on smart contract analysis',
      details: contractRisk?.flags || []
    }
  ];

  // Additional risk indicators
  const hasHighRiskApprovals = approvalRisks?.approvals.some(approval => approval.riskScore > 0.7) || false;
  const isSanctioned = sanctionChecks?.isSanctioned || false;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-panel p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <RiShieldLine className="text-solana-purple" />
          <span>Risk Assessment</span>
        </h3>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Powered by</span>
          <img src="/webacy.png" alt="Webacy" className="w-5 h-5" />
          <span>Webacy</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-solana-purple rounded-full border-t-transparent"
          />
        </div>
      ) : (
        <>
          <div className="relative mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-500">Overall Risk Score</span>
              <span className={`font-semibold ${riskLevel.color}`}>{riskLevel.text}</span>
            </div>
            
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score * 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
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
            
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>Safe</span>
              <span>Risky</span>
            </div>

            <div className="mt-3 p-3 rounded-lg bg-card/30 border border-card">
              <p className="text-sm text-gray-400">
                {riskLevel.description}
              </p>
              {(isSanctioned || hasHighRiskApprovals) && (
                <div className="mt-2 flex items-center gap-2 text-red-500 text-sm">
                  <RiAlertLine className="flex-shrink-0" />
                  <span>
                    {isSanctioned && 'Address is sanctioned. '}
                    {hasHighRiskApprovals && 'High-risk contract approvals detected.'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Risk Factor Breakdown */}
          <div className="mb-8">
            <h4 className="text-sm font-medium mb-4">Risk Factor Breakdown</h4>
            <div className="space-y-4">
              {riskFactors.map((factor, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 rounded-lg bg-card/30"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="text-solana-purple">
                        {factor.icon}
                      </div>
                      <span className="text-sm font-medium">{factor.name}</span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      factor.score > 0.7 ? 'bg-red-500/20 text-red-500' :
                      factor.score > 0.3 ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-green-500/20 text-green-500'
                    }`}>
                      {Math.round(factor.score * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${factor.score * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                        factor.score > 0.7 ? 'bg-red-500' :
                        factor.score > 0.3 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{factor.description}</p>
                  {factor.details.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {factor.details.slice(0, 3).map((detail, i) => (
                        <div key={i} className="text-xs text-gray-500 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                          <span>{detail}</span>
                        </div>
                      ))}
                      {factor.details.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{factor.details.length - 3} more indicators
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Detailed Findings */}
          {details && details.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium mb-2">Detailed Findings</h4>
              {details.map((detail, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-card/30 border border-card/50"
                >
                  <div className={`p-1.5 rounded-lg ${
                    detail.severity === 'high' ? 'bg-red-500/20' :
                    detail.severity === 'medium' ? 'bg-yellow-500/20' :
                    'bg-green-500/20'
                  }`}>
                    {detail.severity === 'high' ? (
                      <RiAlertLine className="text-red-500" />
                    ) : detail.severity === 'medium' ? (
                      <RiAlertLine className="text-yellow-500" />
                    ) : (
                      <RiInformationLine className="text-green-500" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-0.5">{detail.category}</div>
                    <div className="text-xs text-gray-500">{detail.description}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
} 