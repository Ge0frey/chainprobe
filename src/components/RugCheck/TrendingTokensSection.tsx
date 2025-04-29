import { motion } from 'framer-motion';
import { RiBarChartLine } from 'react-icons/ri';

interface TrendingToken {
  mint: string;
  name: string;
  symbol: string;
  votes: number;
  score_normalised: number;
}

// Utility function for risk color
const getRiskColor = (score: number) => {
  if (score <= 30) return 'text-green-500';
  if (score <= 60) return 'text-yellow-500';
  return 'text-red-500';
};

export function TrendingTokensSection({ tokens }: { tokens: TrendingToken[] }) {
  return (
    <div className="glass-panel p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <RiBarChartLine className="text-solana-teal" />
        Trending Tokens
      </h2>
      <div className="space-y-4">
        {tokens.map((token) => (
          <motion.div
            key={token.mint}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-white/5 dark:bg-black/10 rounded-lg border border-gray-200 dark:border-gray-800"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{token.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{token.symbol}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{token.votes} votes</p>
                <p className={`text-sm ${getRiskColor(token.score_normalised)}`}>
                  Score: {token.score_normalised}/100
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
} 