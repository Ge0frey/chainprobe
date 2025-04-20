import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import { Player } from '@lottiefiles/react-lottie-player';
import { 
  RiCloseLine, 
  RiArrowRightLine, 
  RiArrowLeftLine, 
  RiWalletLine,
  RiFlowChart,
  RiUserSearchLine,
  RiGroupLine,
  RiInformationLine,
  RiSearch2Line,
  RiLightbulbLine
} from 'react-icons/ri';
import { SiSolana } from 'react-icons/si';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const guides = [
  {
    id: 'intro',
    title: 'Welcome to Solana Forensic Analysis',
    description: 'This tool helps you analyze Solana blockchain transactions and identify patterns, connections, and suspicious activities.',
    icon: <SiSolana className="text-4xl text-solana-purple" />,
    animation: 'https://lottie.host/96a4ab68-42c1-4e63-8b0d-4249a1a1a393/XUoZ1M0HgC.json',
    tips: [
      'Enter a Solana wallet address to begin your analysis',
      'Navigate between different analysis views using the sidebar',
      'Dark mode is enabled by default for better visualization'
    ]
  },
  {
    id: 'transaction-flow',
    title: 'Transaction Flow Analysis',
    description: 'Visualize how funds move between wallets to identify sources, destinations, and intermediaries in transaction chains.',
    icon: <RiFlowChart className="text-4xl text-blue-500" />,
    animation: 'https://lottie.host/394f49ce-df66-4a31-a5cc-97a796a6c248/6Z71v4TbIy.json',
    tips: [
      'Search for a wallet address to see its incoming and outgoing transactions',
      'Use filters to narrow your search by time period or transaction size',
      'Hover over nodes to see wallet details and transaction volumes',
      'Look for exchange wallets highlighted in amber color'
    ]
  },
  {
    id: 'wallet-analysis',
    title: 'Wallet Analysis',
    description: 'Examine wallet activity over time, transaction patterns, and token holdings to understand user behavior.',
    icon: <RiWalletLine className="text-4xl text-purple-500" />,
    animation: 'https://lottie.host/0842cc57-1c1a-460a-a50b-be95a58ed25e/JhwwJSIDrP.json',
    tips: [
      'Check transaction volume and frequency to identify unusual patterns',
      'Examine token balances and historical holdings',
      'Look for sudden spikes in activity or dormant periods',
      'Analyze transaction counterparties to identify relationship networks'
    ]
  },
  {
    id: 'entity-labels',
    title: 'Entity Labels',
    description: 'Identify and categorize wallets as exchanges, DeFi protocols, NFT marketplaces, or potential suspicious actors.',
    icon: <RiUserSearchLine className="text-4xl text-green-500" />,
    animation: 'https://lottie.host/b2590a2c-8bc1-4c96-a316-a1dd2117e2e6/fCXcWcWkKl.json',
    tips: [
      'Search for addresses to retrieve their known entity types',
      'View historical interactions with labeled entities',
      'Use entity labels to understand the nature of transaction flows',
      'Submit corrections if you have more accurate information about an entity'
    ]
  },
  {
    id: 'transaction-clustering',
    title: 'Transaction Clustering',
    description: 'Group related transactions to identify patterns, potential wash trading, and coordinated activities across multiple wallets.',
    icon: <RiGroupLine className="text-4xl text-amber-500" />,
    animation: 'https://lottie.host/c6b7d5ab-0eec-468d-bc25-8e9f0387cc20/dOCPd0uyF5.json',
    tips: [
      'Find related wallets that might belong to the same entity',
      'Identify circular transaction patterns that could indicate wash trading',
      'Look for temporal patterns in transaction timing',
      'Analyze clustered transactions to detect coordinated movements'
    ]
  },
  {
    id: 'search-tips',
    title: 'Effective Search Strategies',
    description: 'Learn how to efficiently search and analyze blockchain data to find what you\'re looking for.',
    icon: <RiSearch2Line className="text-4xl text-cyan-500" />,
    animation: 'https://lottie.host/87053dcf-2667-453f-90a5-f4aefcf34602/frnQVL3IlQ.json',
    tips: [
      'Start with a known address and explore its transaction network',
      'Filter by date ranges to focus on specific time periods',
      'Use entity labels to identify exchanges and services',
      'Look for high-value transactions or unusual patterns',
      'Track tokens through multiple hops to find their source or destination'
    ]
  },
  {
    id: 'pro-tips',
    title: 'Pro Tips',
    description: 'Advanced techniques for blockchain forensic analysis from experienced investigators.',
    icon: <RiLightbulbLine className="text-4xl text-yellow-500" />,
    animation: 'https://lottie.host/44d46343-3272-409c-a5a4-d2f66404a801/sYABJ94y0u.json',
    tips: [
      'Combine multiple analysis views for a complete picture',
      'Cross-reference with external data sources when possible',
      'Pay attention to transaction timing and patterns',
      'Look for wallets that serve as bridges between clusters',
      'Monitor entity labels to identify potential mixing services',
      'Save addresses of interest for continued monitoring'
    ]
  }
];

export function GuideModal({ isOpen, onClose }: GuideModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTips, setShowTips] = useState(false);

  // Reset to first step when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setShowTips(false);
    }
  }, [isOpen]);

  const currentGuide = guides[currentStep];

  const nextStep = () => {
    if (currentStep < guides.length - 1) {
      setCurrentStep(currentStep + 1);
      setShowTips(false);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setShowTips(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl glass-panel overflow-hidden rounded-2xl text-left align-middle shadow-xl transition-all">
                <div className="absolute top-3 right-3 z-10">
                  <button
                    type="button"
                    className="rounded-full p-2 bg-white/10 hover:bg-white/20 dark:bg-gray-800/10 dark:hover:bg-gray-800/20 backdrop-blur-sm text-gray-500 dark:text-gray-400 transition-colors"
                    onClick={onClose}
                  >
                    <RiCloseLine className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2">
                  {/* Left side - Animation */}
                  <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 p-6 flex flex-col items-center justify-center">
                    <div className="w-52 h-52 mb-4">
                      <Player
                        autoplay
                        loop
                        src={currentGuide.animation}
                      />
                    </div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      key={`icon-${currentGuide.id}`}
                      className="mt-2"
                    >
                      {currentGuide.icon}
                    </motion.div>
                  </div>

                  {/* Right side - Content */}
                  <div className="p-6">
                    <motion.div
                      key={`title-${currentGuide.id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900 dark:text-white">
                        {currentGuide.title}
                      </Dialog.Title>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        {currentGuide.description}
                      </p>
                    </motion.div>

                    {/* Tips Section */}
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => setShowTips(!showTips)}
                        className="flex items-center gap-2 text-sm font-medium text-solana-purple dark:text-solana-teal hover:underline"
                      >
                        <RiInformationLine />
                        <span>{showTips ? 'Hide Tips' : 'Show Tips'}</span>
                      </button>

                      <Transition
                        show={showTips}
                        enter="transition-all duration-300 ease-out"
                        enterFrom="opacity-0 max-h-0"
                        enterTo="opacity-100 max-h-96"
                        leave="transition-all duration-200 ease-in"
                        leaveFrom="opacity-100 max-h-96"
                        leaveTo="opacity-0 max-h-0"
                        className="overflow-hidden"
                      >
                        <motion.div 
                          className="mt-3 bg-white/30 dark:bg-gray-800/30 rounded-lg p-3"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Tips:</h4>
                          <ul className="space-y-2">
                            {currentGuide.tips.map((tip, index) => (
                              <motion.li 
                                key={index}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * index }}
                                className="text-xs text-gray-600 dark:text-gray-300 flex gap-2 items-start"
                              >
                                <div className="h-4 w-4 rounded-full bg-solana-purple/20 dark:bg-solana-teal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <div className="h-1.5 w-1.5 rounded-full bg-solana-purple dark:bg-solana-teal"></div>
                                </div>
                                <span>{tip}</span>
                              </motion.li>
                            ))}
                          </ul>
                        </motion.div>
                      </Transition>
                    </div>

                    {/* Navigation */}
                    <div className="mt-6 flex justify-between items-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Step {currentStep + 1} of {guides.length}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={prevStep}
                          disabled={currentStep === 0}
                          className={`px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm ${
                            currentStep === 0
                              ? 'text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                              : 'text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-gray-800/70 hover:bg-white dark:hover:bg-gray-700'
                          }`}
                        >
                          <RiArrowLeftLine />
                          <span>Previous</span>
                        </button>
                        <button
                          type="button"
                          onClick={nextStep}
                          className="px-4 py-1.5 bg-gradient-solana text-white rounded-lg shadow-glow-purple flex items-center gap-1 text-sm"
                        >
                          <span>{currentStep === guides.length - 1 ? 'Finish' : 'Next'}</span>
                          <RiArrowRightLine />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1 w-full bg-gray-200 dark:bg-gray-700">
                  <motion.div
                    className="h-1 bg-gradient-solana"
                    initial={{ width: `${(currentStep / (guides.length - 1)) * 100}%` }}
                    animate={{ width: `${(currentStep / (guides.length - 1)) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 