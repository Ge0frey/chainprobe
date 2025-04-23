import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiShield, FiSearch, FiActivity } from 'react-icons/fi';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <FiSearch className="w-6 h-6" />,
      title: "Advanced Transaction Analysis",
      description: "Deep dive into Solana transactions with powerful visualization tools and pattern recognition."
    },
    {
      icon: <FiShield className="w-6 h-6" />,
      title: "Forensic Investigation",
      description: "Identify suspicious activities and trace transaction flows with our state-of-the-art forensic tools."
    },
    {
      icon: <FiActivity className="w-6 h-6" />,
      title: "Real-time Monitoring",
      description: "Monitor Solana blockchain activities in real-time with instant alerts and notifications."
    }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full bg-solana-purple/5 dark:bg-solana-purple/10 blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <motion.div 
          className="absolute bottom-[-30%] left-[-20%] w-[80vw] h-[80vw] rounded-full bg-solana-teal/5 dark:bg-solana-teal/10 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.13, 0.1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-16 min-h-screen flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-solana-purple to-solana-teal bg-clip-text text-transparent">
            Solana Forensic Analysis
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Advanced blockchain analysis tools for investigating and monitoring Solana transactions
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/dashboard')}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-4 rounded-lg font-semibold flex items-center gap-2 mx-auto"
          >
            Launch Dashboard
            <FiArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>

        {/* Features section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 * (index + 1) }}
              className="bg-card p-6 rounded-xl border border-border hover:border-primary/50 transition-colors"
            >
              <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 