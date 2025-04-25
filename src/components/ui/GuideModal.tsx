import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiCloseLine, RiArrowLeftSLine, RiArrowRightSLine, RiInformationLine, RiWalletLine, RiFlowChart, RiUserSearchLine, RiGroupLine, RiRadarLine, RiLightbulbLine } from 'react-icons/ri';
import { Player } from '@lottiefiles/react-lottie-player';
import { SiSolana } from 'react-icons/si';

// Define the guide steps with additional tips
const guideSteps = [
  {
    title: "Welcome to Solana Forensics",
    content: "This tool helps you analyze and visualize on-chain activity on the Solana blockchain. Navigate through this guide to learn about the key features.",
    icon: <SiSolana className="text-solana-purple text-2xl" />,
    animation: "https://assets8.lottiefiles.com/packages/lf20_m6cuL6.json",
    additionalTips: [
      "Use dark/light mode toggle in the sidebar to adjust visibility",
      "Access this guide anytime from the sidebar menu",
      "All data is fetched in real-time from the Solana blockchain"
    ]
  },
  {
    title: "Transaction Flow Analysis",
    content: "Visualize the flow of funds between wallets to track the movement of SOL and tokens across multiple hops.",
    icon: <RiFlowChart className="text-solana-teal text-2xl" />,
    animation: "https://assets10.lottiefiles.com/packages/lf20_tk5xibbd.json",
    additionalTips: [
      "Use the zoom controls to explore large transaction networks",
      "Click on nodes to see detailed transaction information",
      "Export visualizations for reporting purposes",
      "Filter transactions by date range and amount"
    ]
  },
  {
    title: "Wallet Analysis",
    content: "Analyze transaction patterns, balance history, and behavioral metrics for any Solana wallet address.",
    icon: <RiWalletLine className="text-solana-purple text-2xl" />,
    animation: "https://assets10.lottiefiles.com/packages/lf20_uha6bcse.json",
    additionalTips: [
      "Track historical balance changes over time",
      "Monitor token holdings and transfers",
      "Identify frequent transaction partners",
      "Analyze transaction velocity and patterns"
    ]
  },
  {
    title: "Entity Labels",
    content: "Identify and label known entities like exchanges, protocols, and other services to better understand transaction context.",
    icon: <RiUserSearchLine className="text-solana-teal text-2xl" />,
    animation: "https://assets5.lottiefiles.com/packages/lf20_ikvz7qhc.json",
    additionalTips: [
      "Create custom labels for addresses",
      "Import and export label datasets",
      "Set confidence levels for entity identification",
      "Share labels with your team"
    ]
  },
  {
    title: "Transaction Clustering",
    content: "Group related transactions to identify patterns and detect potentially suspicious activity across the network.",
    icon: <RiGroupLine className="text-solana-purple text-2xl" />,
    animation: "https://assets5.lottiefiles.com/packages/lf20_lqbq0sjr.json",
    additionalTips: [
      "Adjust clustering parameters for different scenarios",
      "Identify related transaction groups",
      "Detect circular transaction patterns",
      "Export cluster analysis reports"
    ]
  },
  {
    title: "Pattern Analysis",
    content: "Use advanced analytics to detect suspicious patterns like wash trading, circular transactions, and other anomalies.",
    icon: <RiRadarLine className="text-solana-teal text-2xl" />,
    animation: "https://assets9.lottiefiles.com/packages/lf20_rbtawnwz.json",
    additionalTips: [
      "Configure pattern detection thresholds",
      "Set up alerts for suspicious activities",
      "Generate risk assessment reports",
      "Track pattern evolution over time"
    ]
  }
];

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GuideModal({ isOpen, onClose }: GuideModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showMoreTips, setShowMoreTips] = useState(false);
  
  const handleClose = () => {
    // Reset to first step when closing
    setTimeout(() => {
      setCurrentStep(0);
      setShowMoreTips(false);
    }, 300);
    onClose();
  };
  
  const nextStep = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setShowMoreTips(false);
    } else {
      handleClose();
    }
  };
  
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setShowMoreTips(false);
    }
  };
  
  const currentGuide = guideSteps[currentStep];
  
  // Modal animation variants
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2, ease: "easeIn" } }
  };
  
  // Content animation variants
  const contentVariants = {
    hidden: { opacity: 0, x: 10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3, delay: 0.1 } },
    exit: { opacity: 0, x: -10, transition: { duration: 0.2 } }
  };

  // Tips animation variants
  const tipsVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: "auto", transition: { duration: 0.3 } },
    exit: { opacity: 0, height: 0, transition: { duration: 0.2 } }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog 
          static 
          as={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60"
          open={isOpen} 
          onClose={handleClose}
        >
          <Dialog.Overlay 
            as={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          />
          
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-2xl rounded-2xl bg-gradient-to-br from-gray-900/95 via-gray-900/98 to-gray-800/95 shadow-2xl border border-white/10 overflow-hidden"
          >
            {/* Decorative elements */}
            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-solana-purple/10 blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-solana-teal/10 blur-3xl"></div>
            
            {/* Progress bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800">
              <motion.div 
                className="h-full bg-gradient-to-r from-solana-purple to-solana-teal"
                initial={{ width: `${(currentStep / (guideSteps.length - 1)) * 100}%` }}
                animate={{ width: `${(currentStep / (guideSteps.length - 1)) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors border border-white/10"
            >
              <RiCloseLine className="text-xl" />
            </button>
          
            <div className="p-6 md:p-10 flex flex-col md:flex-row gap-6 md:gap-10">
              {/* Left column - Animation */}
              <div className="md:w-1/2 flex items-center justify-center">
                <div className="w-full h-48 md:h-64 flex items-center justify-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-solana-purple/20 to-solana-teal/20 rounded-full flex items-center justify-center">
                    {currentGuide.icon ? (
                      <div className="text-6xl">
                        {currentGuide.icon}
                      </div>
                    ) : (
                      <SiSolana className="text-solana-purple text-6xl" />
                    )}
                  </div>
                </div>
              </div>
              
              {/* Right column - Content */}
              <div className="md:w-1/2">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="h-full flex flex-col"
                  >
                    <div className="mb-6 flex items-center">
                      <div className="p-3 rounded-xl bg-gray-800/50 backdrop-blur-sm border border-white/10 mr-4">
                        {currentGuide.icon}
                      </div>
                      <Dialog.Title className="text-xl font-bold text-white">
                        {currentGuide.title}
                      </Dialog.Title>
                    </div>
                    
                    <Dialog.Description className="text-gray-300 mb-4 text-sm md:text-base">
                      {currentGuide.content}
                    </Dialog.Description>

                    {/* Tips section */}
                    <div className="mb-6">
                      {/* Show More Tips button */}
                      <button
                        onClick={() => setShowMoreTips(!showMoreTips)}
                        className="w-full p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white transition-all duration-200 flex items-center justify-center gap-2 border border-white/10"
                      >
                        <RiLightbulbLine className="text-solana-teal" />
                        <span>{showMoreTips ? 'Show Less Tips' : 'Show More Tips'}</span>
                      </button>

                      {/* Additional tips */}
                      <AnimatePresence>
                        {showMoreTips && (
                          <motion.div
                            variants={tipsVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className="mt-3 space-y-2 overflow-hidden"
                          >
                            {currentGuide.additionalTips.map((tip, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3"
                              >
                                <RiLightbulbLine className="text-solana-teal text-xl flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-gray-300">{tip}</p>
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    {/* Navigation buttons */}
                    <div className="flex justify-between mt-auto">
                      <button
                        onClick={prevStep}
                        disabled={currentStep === 0}
                        className={`flex items-center gap-1 px-4 py-2 rounded-lg ${
                          currentStep === 0 
                            ? 'opacity-50 cursor-not-allowed bg-gray-800/50 text-gray-500' 
                            : 'bg-gray-800/70 hover:bg-gray-700/70 text-white'
                        } border border-white/10 transition-colors`}
                      >
                        <RiArrowLeftSLine className="text-lg" />
                        <span>Back</span>
                      </button>
                      
                      <button
                        onClick={nextStep}
                        className="flex items-center gap-1 px-6 py-2 rounded-lg bg-gradient-to-r from-solana-purple/90 to-solana-teal/90 hover:from-solana-purple hover:to-solana-teal text-white shadow-md transition-all duration-200"
                      >
                        <span>{currentStep === guideSteps.length - 1 ? 'Finish' : 'Next'}</span>
                        {currentStep < guideSteps.length - 1 && <RiArrowRightSLine className="text-lg" />}
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
            
            {/* Step indicators */}
            <div className="flex justify-center gap-1.5 p-4 border-t border-white/5">
              {guideSteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentStep(index);
                    setShowMoreTips(false);
                  }}
                  className="p-1"
                >
                  <div 
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      currentStep === index 
                        ? 'bg-gradient-to-r from-solana-purple to-solana-teal w-6' 
                        : 'bg-gray-700'
                    }`}
                  />
                </button>
              ))}
            </div>
          </motion.div>
        </Dialog>
      )}
    </AnimatePresence>
  );
} 