import { motion } from 'framer-motion';
import { RiShieldLine, RiAlertLine, RiInformationLine } from 'react-icons/ri';

interface RiskScoreCardProps {
  score: number;
  loading?: boolean;
  details?: {
    category: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }[];
  className?: string;
}

export function RiskScoreCard({ score, loading, details, className = '' }: RiskScoreCardProps) {
  const getRiskLevel = (score: number) => {
    if (score <= 0.3) return { text: 'LOW', color: 'text-green-500', bg: 'bg-green-500' };
    if (score <= 0.7) return { text: 'MEDIUM', color: 'text-yellow-500', bg: 'bg-yellow-500' };
    return { text: 'HIGH', color: 'text-red-500', bg: 'bg-red-500' };
  };

  const riskLevel = getRiskLevel(score);

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
              <span className="text-sm text-gray-500">Risk Score</span>
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
          </div>

          {details && details.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium mb-2">Risk Factors</h4>
              {details.map((detail, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-card/30"
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