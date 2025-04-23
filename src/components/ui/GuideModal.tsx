import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiCloseLine, RiArrowLeftSLine, RiArrowRightSLine, RiInformationLine, RiWalletLine, RiFlowChart, RiUserSearchLine, RiGroupLine, RiRadarLine } from 'react-icons/ri';
import { Player } from '@lottiefiles/react-lottie-player';
import { SiSolana } from 'react-icons/si';

// Define the guide steps
const guideSteps = [
  {
    title: "Welcome to Solana Forensics",
    content: "This tool helps you analyze and visualize on-chain activity on the Solana blockchain. Navigate through this guide to learn about the key features.",
    icon: <SiSolana className="text-solana-purple text-2xl" />,
    animation: "https://assets8.lottiefiles.com/packages/lf20_m6cuL6.json"
  },
  {
    title: "Transaction Flow Analysis",
    content: "Visualize the flow of funds between wallets to track the movement of SOL and tokens across multiple hops.",
    icon: <RiFlowChart className="text-solana-teal text-2xl" />,
    animation: "https://assets10.lottiefiles.com/packages/lf20_tk5xibbd.json"
  },
  {
    title: "Wallet Analysis",
    content: "Analyze transaction patterns, balance history, and behavioral metrics for any Solana wallet address.",
    icon: <RiWalletLine className="text-solana-purple text-2xl" />,
    animation: "https://assets10.lottiefiles.com/packages/lf20_uha6bcse.json"
  },
  {
    title: "Entity Labels",
    content: "Identify and label known entities like exchanges, protocols, and other services to better understand transaction context.",
    icon: <RiUserSearchLine className="text-solana-teal text-2xl" />,
    animation: "https://assets5.lottiefiles.com/packages/lf20_ikvz7qhc.json"
  },
  {
    title: "Transaction Clustering",
    content: "Group related transactions to identify patterns and detect potentially suspicious activity across the network.",
    icon: <RiGroupLine className="text-solana-purple text-2xl" />,
    animation: "https://assets5.lottiefiles.com/packages/lf20_lqbq0sjr.json"
  },
  {
    title: "Pattern Analysis",
    content: "Use advanced analytics to detect suspicious patterns like wash trading, circular transactions, and other anomalies.",
    icon: <RiRadarLine className="text-solana-teal text-2xl" />,
    animation: "https://assets9.lottiefiles.com/packages/lf20_rbtawnwz.json" 
  }
];

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GuideModal({ isOpen, onClose }: GuideModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  const handleClose = () => {
    // Reset to first step when closing
    setTimeout(() => setCurrentStep(0), 300);
    onClose();
  };
  
  const nextStep = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };
  
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
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
                <div className="w-full h-48 md:h-64">
                  <Player
                    autoplay
                    loop
                    src={currentGuide.animation}
                    style={{ height: '100%', width: '100%' }}
                  />
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
                    
                    <Dialog.Description className="text-gray-300 mb-6 text-sm md:text-base flex-grow">
                      {currentGuide.content}
                    </Dialog.Description>
                    
                    {/* User tip */}
                    <div className="mb-6 p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
                      <RiInformationLine className="text-solana-purple text-xl flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-300">
                        Tip: You can reopen this guide anytime by clicking the Help Guide button in the sidebar.
                      </p>
                    </div>
                    
                    {/* Navigation buttons */}
                    <div className="flex justify-between">
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
                  onClick={() => setCurrentStep(index)}
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