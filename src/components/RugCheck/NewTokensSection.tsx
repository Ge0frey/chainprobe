import { motion } from 'framer-motion';
import { RiTimeLine } from 'react-icons/ri';

interface NewToken {
  mint: string;
  name: string;
  symbol: string;
  timestamp: number;
}

export function NewTokensSection({ tokens }: { tokens: NewToken[] }) {
  return (
    <div className="glass-panel p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <RiTimeLine className="text-solana-purple" />
        New Tokens
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
              <p className="text-sm text-gray-500">
                {new Date(token.timestamp * 1000).toLocaleString()}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
} 