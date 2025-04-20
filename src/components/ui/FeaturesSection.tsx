import { motion } from 'framer-motion';
import { FeatureCard } from './FeatureCard';
import { Link } from 'react-router-dom';
import { 
  RiFlowChart, 
  RiWalletLine, 
  RiUserSearchLine, 
  RiGroupLine,
  RiQuestionLine
} from 'react-icons/ri';
import { useGuideModal } from './useGuideModal';

export function FeaturesSection() {
  const { openGuide } = useGuideModal();
  
  const features = [
    {
      title: 'Transaction Flow Analysis',
      description: 'Visualize funds movement between wallets to identify sources, destinations, and transaction patterns.',
      icon: <RiFlowChart className="text-2xl" />,
      color: 'blue' as const,
      delay: 0.1,
      path: '/transaction-flow'
    },
    {
      title: 'Wallet Analysis',
      description: 'Examine wallet activity over time, transaction patterns, and token holdings to understand behavior.',
      icon: <RiWalletLine className="text-2xl" />,
      color: 'purple' as const,
      delay: 0.2,
      path: '/wallet-analysis'
    },
    {
      title: 'Entity Recognition',
      description: 'Identify and categorize wallets as exchanges, protocols, or potential suspicious actors.',
      icon: <RiUserSearchLine className="text-2xl" />,
      color: 'green' as const,
      delay: 0.3,
      path: '/entity-labels'
    },
    {
      title: 'Transaction Clustering',
      description: 'Group related transactions to identify patterns and coordinated activities across multiple wallets.',
      icon: <RiGroupLine className="text-2xl" />,
      color: 'amber' as const,
      delay: 0.4,
      path: '/transaction-clustering'
    },
  ];
  
  return (
    <div className="my-8">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-2 gradient-text inline-block">Forensic Analysis Tools</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Powerful forensic analysis capabilities to help you investigate and understand on-chain activities on Solana.
        </p>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <Link key={index} to={feature.path}>
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 flex justify-center"
      >
        <button
          onClick={openGuide}
          className="px-5 py-2 rounded-lg bg-white/70 dark:bg-gray-800/70 border border-white/20 dark:border-gray-700/30 shadow-md hover:shadow-lg transition-shadow flex items-center gap-2 text-gray-700 dark:text-gray-300"
        >
          <RiQuestionLine className="text-solana-purple dark:text-solana-teal text-xl" />
          <span>How to use these features</span>
        </button>
      </motion.div>
    </div>
  );
} 