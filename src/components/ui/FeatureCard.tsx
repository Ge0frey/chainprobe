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
    bgLight: 'bg-blue-50',
    bgDark: 'dark:bg-blue-900/20',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    titleColor: 'text-blue-900 dark:text-blue-300',
    textColor: 'text-blue-700 dark:text-blue-400',
  },
  purple: {
    bgLight: 'bg-purple-50',
    bgDark: 'dark:bg-purple-900/20',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
    titleColor: 'text-purple-900 dark:text-purple-300',
    textColor: 'text-purple-700 dark:text-purple-400',
  },
  green: {
    bgLight: 'bg-green-50',
    bgDark: 'dark:bg-green-900/20',
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
    titleColor: 'text-green-900 dark:text-green-300',
    textColor: 'text-green-700 dark:text-green-400',
  },
  amber: {
    bgLight: 'bg-amber-50',
    bgDark: 'dark:bg-amber-900/20',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    titleColor: 'text-amber-900 dark:text-amber-300',
    textColor: 'text-amber-700 dark:text-amber-400',
  },
  teal: {
    bgLight: 'bg-teal-50',
    bgDark: 'dark:bg-teal-900/20',
    iconBg: 'bg-teal-100 dark:bg-teal-900/30',
    iconColor: 'text-teal-600 dark:text-teal-400',
    titleColor: 'text-teal-900 dark:text-teal-300',
    textColor: 'text-teal-700 dark:text-teal-400',
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
      className={`relative overflow-hidden rounded-xl p-6 ${styles.bgLight} ${styles.bgDark} backdrop-blur-sm border border-white/20 dark:border-gray-700/30 shadow-lg`}
    >
      <div className="absolute right-0 top-0 h-16 w-16 translate-x-1/3 -translate-y-1/3 transform rounded-full bg-white/40 dark:bg-white/5 blur-2xl"></div>
      
      <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg ${styles.iconBg}`}>
        <div className={styles.iconColor}>
          {icon}
        </div>
      </div>
      
      <h3 className={`mb-2 text-lg font-bold ${styles.titleColor}`}>
        {title}
      </h3>
      
      <p className={`text-sm ${styles.textColor}`}>
        {description}
      </p>
    </motion.div>
  );
} 