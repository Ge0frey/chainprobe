import { motion } from 'framer-motion';
import { FeatureCard } from './FeatureCard';
import { Link } from 'react-router-dom';
import { 
  RiFlowChart, 
  RiWalletLine, 
  RiUserSearchLine, 
  RiGroupLine,
  RiQuestionLine,
  RiRadarLine
} from 'react-icons/ri';
import { useGuideModal } from './useGuideModal';

export function FeaturesSection() {
  const { openGuide } = useGuideModal();
  
  const features = [
    {
      title: 'Transaction Flow',
      description: 'Track the movement of funds across the blockchain with interactive visualizations.',
      icon: <RiFlowChart className="text-2xl" />,
      color: 'blue' as const,
      delay: 0.1,
      path: '/transaction-flow'
    },
    {
      title: 'Wallet Analysis',
      description: 'Deep-dive into wallet behavior, transaction patterns, and historical activity.',
      icon: <RiWalletLine className="text-2xl" />,
      color: 'purple' as const,
      delay: 0.2,
      path: '/wallet-analysis'
    },
    {
      title: 'Entity Recognition',
      description: 'Identify and label known entities like exchanges, protocols, and suspicious actors.',
      icon: <RiUserSearchLine className="text-2xl" />,
      color: 'teal' as const,
      delay: 0.3,
      path: '/entity-labels'
    },
    {
      title: 'Transaction Clustering',
      description: 'Group related transactions to reveal hidden patterns and connections.',
      icon: <RiGroupLine className="text-2xl" />,
      color: 'amber' as const,
      delay: 0.4,
      path: '/transaction-clustering'
    },
    {
      title: 'Pattern Analysis',
      description: 'Detect suspicious patterns like wash trading, circular transactions, and anomalies.',
      icon: <RiRadarLine className="text-2xl" />,
      color: 'green' as const, 
      delay: 0.5,
      path: '/pattern-analysis'
    }
  ];
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="py-12"
    >
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mb-12 text-center"
      >
        <h2 className="text-3xl font-bold mb-3">
          <span className="bg-gradient-to-r from-solana-purple to-solana-teal bg-clip-text text-transparent">
            Forensic Analysis Suite
          </span>
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
          Advanced blockchain investigation tools to track, analyze, and visualize Solana transactions
        </p>
      </motion.div>
      
      {/* Wave Divider */}
      <div className="w-full h-10 relative overflow-hidden mb-10">
        <svg className="absolute w-full h-24 -top-14" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <motion.path 
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: 0.1, pathLength: 1 }}
            transition={{ duration: 1.5, delay: 0.2 }}
            d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z" 
            className="fill-solana-purple"
          />
        </svg>
      </div>
      
      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 px-4">
        {features.map((feature, index) => (
          <Link key={index} to={feature.path} className="group">
            <FeatureCard
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              color={feature.color}
              delay={feature.delay}
            />
          </Link>
        ))}
      </div>
      
      {/* Guide Button */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="mt-12 flex justify-center"
      >
        <button
          onClick={openGuide}
          className="px-6 py-3 rounded-xl bg-gradient-to-r hover:from-solana-purple hover:to-solana-teal from-solana-purple/80 to-solana-teal/80 text-white shadow-lg hover:shadow-solana-purple/20 transition-all duration-300 flex items-center gap-3"
        >
          <RiQuestionLine className="text-2xl" />
          <span>How to use these tools</span>
        </button>
      </motion.div>
      
      {/* Floating Orbs */}
      <div className="relative w-full h-0">
        <motion.div
          animate={{
            y: [0, -15, 0],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 left-[15%] w-24 h-24 rounded-full bg-solana-purple/5 blur-2xl"
        />
        <motion.div
          animate={{
            y: [0, 15, 0],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute top-10 right-[20%] w-32 h-32 rounded-full bg-solana-teal/5 blur-3xl"
        />
      </div>
    </motion.div>
  );
} 