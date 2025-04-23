import { motion } from 'framer-motion';

export const Spinner = () => {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer ring */}
      <motion.div
        animate={{
          rotate: 360
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear"
        }}
        className="w-10 h-10 rounded-full border-2 border-transparent border-t-solana-purple border-r-solana-teal border-b-solana-purple border-l-solana-teal shadow-[0_0_10px_rgba(153,69,255,0.3)] backdrop-blur-sm"
      />
      
      {/* Inner ring */}
      <motion.div
        animate={{
          rotate: -180
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute w-6 h-6 rounded-full border-2 border-transparent border-t-solana-teal border-r-solana-purple/70 border-b-transparent border-l-solana-purple/70"
      />
      
      {/* Center dot */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute w-2 h-2 rounded-full bg-gradient-to-br from-solana-purple to-solana-teal shadow-[0_0_8px_rgba(20,241,149,0.6)]"
      />
      
      {/* Tiny satellites */}
      <motion.div 
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <motion.div
          animate={{
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.2
          }}
          className="absolute w-1 h-1 rounded-full bg-solana-teal top-0 left-1/2 transform -translate-x-1/2"
        />
        <motion.div
          animate={{
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
          className="absolute w-1 h-1 rounded-full bg-solana-purple bottom-0 left-1/2 transform -translate-x-1/2"
        />
      </motion.div>
    </div>
  );
}; 