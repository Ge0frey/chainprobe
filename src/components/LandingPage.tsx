import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiShield, FiSearch, FiActivity, FiLayers, FiEye } from 'react-icons/fi';
import { SiSolana } from 'react-icons/si';
import { FeaturesSection } from './ui/FeaturesSection';

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
    },
    {
      icon: <FiLayers className="w-6 h-6" />,
      title: "Multi-dimensional Insights",
      description: "Gain comprehensive insights from transaction patterns through our advanced clustering algorithms."
    },
    {
      icon: <FiEye className="w-6 h-6" />,
      title: "Entity Identification",
      description: "Uncover hidden relationships and identify entities across the Solana ecosystem."
    }
  ];

  const floatingIcons = [
    { icon: <SiSolana />, delay: 0, duration: 12, size: "w-8 h-8" },
    { icon: <SiSolana />, delay: 3, duration: 10, size: "w-6 h-6" },
    { icon: <SiSolana />, delay: 7, duration: 14, size: "w-5 h-5" },
    { icon: <SiSolana />, delay: 2, duration: 13, size: "w-4 h-4" },
    { icon: <SiSolana />, delay: 5, duration: 11, size: "w-7 h-7" }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-[-30%] right-[-15%] w-[80vw] h-[80vw] rounded-full bg-solana-purple/5 dark:bg-solana-purple/10 blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <motion.div 
          className="absolute bottom-[-40%] left-[-20%] w-[90vw] h-[90vw] rounded-full bg-solana-teal/5 dark:bg-solana-teal/10 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />

        <motion.div 
          className="absolute top-[30%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-solana-blue/5 dark:bg-solana-blue/10 blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />

        {/* Floating Solana icons */}
        {floatingIcons.map((item, index) => (
          <motion.div
            key={index}
            className={`absolute text-solana-purple/20 dark:text-solana-purple/30 ${item.size}`}
            initial={{ 
              x: `${Math.random() * 100}vw`, 
              y: `${Math.random() * 100}vh` 
            }}
            animate={{
              y: ["0vh", "100vh"],
              x: [`${Math.random() * 30 + 35}vw`, `${Math.random() * 30 + 35}vw`],
              rotate: [0, 360],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{
              duration: item.duration,
              repeat: Infinity,
              delay: item.delay,
              ease: "linear"
            }}
          >
            {item.icon}
          </motion.div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-16 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <motion.div
            className="flex justify-center items-center gap-3 mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.div 
              className="p-2 rounded-full bg-gradient-to-br from-solana-purple to-solana-teal"
              animate={{ 
                rotate: [0, 10, 0, -10, 0],
                scale: [1, 1.1, 1, 1.1, 1]
              }}
              transition={{ 
                duration: 6, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <SiSolana className="w-8 h-8 text-white" />
            </motion.div>
          </motion.div>

          <motion.h1 
            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-solana-purple to-solana-teal bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            ChainProbe
          </motion.h1>

          <motion.p 
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Advanced blockchain forensics platform for the Solana ecosystem
          </motion.p>

          <motion.p 
            className="text-lg text-muted-foreground/80 max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            Uncover hidden patterns, trace fund movements, and analyze transaction networks with precision and clarity
          </motion.p>

          <motion.div
            className="flex flex-wrap justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(153, 69, 255, 0.5)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard')}
              className="bg-gradient-to-r from-solana-purple to-solana-teal text-white px-8 py-4 rounded-lg font-semibold flex items-center gap-2"
            >
              Launch Dashboard
              <FiArrowRight className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "hsla(var(--card)/0.8)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-card/60 backdrop-blur-sm border border-border text-card-foreground px-8 py-4 rounded-lg font-semibold"
            >
              Explore Features
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Stats Section - REMOVING THIS SECTION AS REQUESTED */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex flex-col items-center justify-center max-w-4xl mx-auto mb-16 text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-card/30 backdrop-blur-sm p-6 rounded-xl border border-border mb-6 w-full max-w-3xl"
          >
            <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-solana-purple to-solana-teal bg-clip-text text-transparent">
              Blockchain Forensics Simplified
            </h3>
            <p className="text-muted-foreground">
              ChainProbe delivers a powerful yet intuitive interface for blockchain investigators, researchers, and compliance teams to analyze Solana transactions with precision and clarity.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
            <motion.div
              whileHover={{ scale: 1.03, borderColor: "hsla(var(--primary)/0.5)" }}
              className="flex items-center p-4 rounded-xl bg-card/30 backdrop-blur-sm border border-border"
            >
              <div className="bg-solana-purple/10 dark:bg-solana-purple/20 p-3 rounded-full mr-4">
                <FiShield className="w-5 h-5 text-solana-purple" />
              </div>
              <div className="text-left">
                <h4 className="font-medium">Enterprise-grade Security</h4>
                <p className="text-xs text-muted-foreground">Advanced security protocols for sensitive analyses</p>
              </div>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.03, borderColor: "hsla(var(--primary)/0.5)" }}
              className="flex items-center p-4 rounded-xl bg-card/30 backdrop-blur-sm border border-border"
            >
              <div className="bg-solana-teal/10 dark:bg-solana-teal/20 p-3 rounded-full mr-4">
                <FiActivity className="w-5 h-5 text-solana-teal" />
              </div>
              <div className="text-left">
                <h4 className="font-medium">Real-time Updates</h4>
                <p className="text-xs text-muted-foreground">Stay current with the latest blockchain activities</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Features section */}
        <div id="features" className="mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-3xl font-bold text-center mb-12"
          >
            <span className="bg-gradient-to-r from-solana-purple to-solana-teal bg-clip-text text-transparent">
              Comprehensive Toolset
            </span>
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.1 * index }}
                whileHover={{ 
                  scale: 1.03, 
                  boxShadow: "0 0 20px rgba(var(--primary)/0.2)",
                  borderColor: "hsla(var(--primary)/0.5)" 
                }}
                className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border transition-all duration-300"
              >
                <motion.div 
                  className="bg-primary/10 p-3 rounded-lg w-fit mb-4"
                  whileHover={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Full Feature Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="py-12"
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-3xl font-bold text-center mb-8"
          >
            <span className="bg-gradient-to-r from-solana-purple to-solana-teal bg-clip-text text-transparent">
              Our Analysis Tools
            </span>
          </motion.h2>
          
          <FeaturesSection />
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-8 pt-8 border-t border-border text-center text-muted-foreground/70"
        >
          <div className="flex items-center justify-center mb-4">
            <SiSolana className="w-5 h-5 mr-2 text-solana-purple" />
            <p className="text-sm">Powered by Solana</p>
          </div>
          <p className="text-xs">© {new Date().getFullYear()} ChainProbe - Advanced Blockchain Forensics</p>
        </motion.div>
      </div>
    </div>
  );
};

export default LandingPage; 