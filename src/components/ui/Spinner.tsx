import { motion } from 'framer-motion';

export const Spinner = () => {
  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        animate={{
          rotate: 360
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear"
        }}
        className="w-8 h-8 border-2 border-t-solana-purple border-r-solana-teal border-b-solana-purple border-l-solana-teal rounded-full"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="w-2 h-2 bg-solana-teal rounded-full" />
      </motion.div>
    </div>
  );
}; 