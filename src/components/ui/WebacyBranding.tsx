import { motion } from 'framer-motion';

interface WebacyBrandingProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function WebacyBranding({ className = '', size = 'md' }: WebacyBrandingProps) {
  const sizes = {
    sm: {
      container: 'text-xs',
      logo: 'w-4 h-4',
    },
    md: {
      container: 'text-sm',
      logo: 'w-6 h-6',
    },
    lg: {
      container: 'text-base',
      logo: 'w-8 h-8',
    },
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex items-center gap-2 ${sizes[size].container} ${className}`}
    >
      <span className="text-gray-500">Powered by</span>
      <img 
        src="/webacy.png" 
        alt="Webacy" 
        className={`${sizes[size].logo} transition-transform hover:scale-110`} 
      />
      <span className="font-medium text-gray-500">Webacy</span>
    </motion.div>
  );
} 