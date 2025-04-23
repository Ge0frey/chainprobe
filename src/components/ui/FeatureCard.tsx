import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  color: 'blue' | 'purple' | 'green' | 'amber' | 'teal';
  delay?: number;
}

const colorStyles = {
  blue: {
    gradient: 'from-blue-500/20 to-blue-600/5',
    glow: 'shadow-blue-500/20',
    iconGradient: 'from-blue-400 to-blue-600',
    textGradient: 'from-blue-400 to-blue-600',
    border: 'border-blue-500/10',
  },
  purple: {
    gradient: 'from-purple-500/20 to-purple-600/5',
    glow: 'shadow-purple-500/20',
    iconGradient: 'from-purple-400 to-purple-600',
    textGradient: 'from-purple-400 to-purple-600',
    border: 'border-purple-500/10',
  },
  green: {
    gradient: 'from-green-500/20 to-green-600/5',
    glow: 'shadow-green-500/20',
    iconGradient: 'from-green-400 to-green-600',
    textGradient: 'from-green-400 to-green-600',
    border: 'border-green-500/10',
  },
  amber: {
    gradient: 'from-amber-500/20 to-amber-600/5',
    glow: 'shadow-amber-500/20',
    iconGradient: 'from-amber-400 to-amber-600',
    textGradient: 'from-amber-400 to-amber-600',
    border: 'border-amber-500/10',
  },
  teal: {
    gradient: 'from-teal-500/20 to-teal-600/5',
    glow: 'shadow-teal-500/20',
    iconGradient: 'from-teal-400 to-teal-600',
    textGradient: 'from-teal-400 to-teal-600',
    border: 'border-teal-500/10',
  },
};

export function FeatureCard({ title, description, icon, color, delay = 0 }: FeatureCardProps) {
  const styles = colorStyles[color];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: delay,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      whileHover={{ 
        scale: 1.02, 
        y: -5,
        transition: { duration: 0.2 } 
      }}
      whileTap={{ scale: 0.98 }}
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${styles.gradient} p-6 backdrop-blur-sm border ${styles.border} shadow-lg hover:shadow-xl transition-all duration-300`}
    >
      {/* Decorative elements */}
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
      <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-white/5 blur-3xl"></div>
      
      {/* Icon */}
      <div className="relative z-10 mb-5">
        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${styles.iconGradient} p-0.5`}>
          <div className="flex h-full w-full items-center justify-center rounded-xl bg-black/20 backdrop-blur-sm">
            <div className="text-white text-2xl">
              {icon}
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        <h3 className={`mb-2 text-lg font-bold bg-gradient-to-r ${styles.textGradient} bg-clip-text text-transparent`}>
          {title}
        </h3>
        
        <p className="text-sm text-white/80">
          {description}
        </p>
      </div>
      
      {/* Arrow indicator */}
      <div className="absolute bottom-4 right-4 opacity-0 transform translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
        <motion.div 
          animate={{ x: [0, 3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className={`text-xl bg-gradient-to-r ${styles.textGradient} bg-clip-text text-transparent`}
        >
          →
        </motion.div>
      </div>
    </motion.div>
  );
} 