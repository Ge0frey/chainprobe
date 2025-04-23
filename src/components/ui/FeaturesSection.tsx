import { motion } from 'framer-motion';
import { FeatureCard } from './FeatureCard';
import { Link } from 'react-router-dom';
import { 
  RiFlowChart, 
  RiWalletLine, 
  RiUserSearchLine, 
  RiGroupLine,
  RiRadarLine
} from 'react-icons/ri';

export function FeaturesSection() {
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
    </motion.div>
  );
} 