import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiBankLine, 
  RiFlowChart, 
  RiWalletLine, 
  RiUserSearchLine, 
  RiGroupLine,
  RiSunLine,
  RiMoonLine,
  RiMenuLine,
  RiCloseLine,
  RiQuestionLine
} from 'react-icons/ri';
import { SiSolana } from 'react-icons/si';
import { GuideModal } from './ui/GuideModal';
import { useGuideModal } from './ui/useGuideModal';

// The variants for the page transitions
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: -20,
  },
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.4,
};

interface LayoutProps {
  children: React.ReactNode;
}

const NavLink = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link 
      to={to} 
      className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 ${
        isActive 
          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' 
          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'
      }`}
    >
      <div className={`text-xl ${isActive ? 'text-primary-600 dark:text-primary-400' : ''}`}>
        {icon}
      </div>
      <span className="font-medium">{label}</span>
      {isActive && (
        <motion.div
          layoutId="activeNavIndicator"
          className="absolute left-0 w-1 h-8 bg-gradient-to-b from-solana-purple to-solana-teal rounded-r-full"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
    </Link>
  );
};

export default function Layout({ children }: LayoutProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isOpen, onClose, openGuide } = useGuideModal();

  // Handle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero ribbon */}
      <div className="h-1.5 w-full bg-gradient-solana"></div>
      
      {/* Main container */}
      <div className="flex flex-1">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex flex-col w-64 border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
          <div className="p-4">
            <Link to="/" className="flex items-center gap-2 mb-8">
              <SiSolana className="text-3xl text-solana-purple" />
              <div>
                <h1 className="font-bold text-xl text-gray-900 dark:text-white leading-none">Solana</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Forensic Analysis</p>
              </div>
            </Link>
          
            <nav className="space-y-1 relative">
              <NavLink to="/" icon={<RiBankLine />} label="Dashboard" />
              <NavLink to="/transaction-flow" icon={<RiFlowChart />} label="Transaction Flow" />
              <NavLink to="/wallet-analysis" icon={<RiWalletLine />} label="Wallet Analysis" />
              <NavLink to="/entity-labels" icon={<RiUserSearchLine />} label="Entity Labels" />
              <NavLink to="/transaction-clustering" icon={<RiGroupLine />} label="Transaction Clustering" />
            </nav>
          </div>
          
          <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-800">
            <button 
              onClick={openGuide} 
              className="flex items-center gap-2 px-4 py-2 w-full rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 mb-3"
            >
              <RiQuestionLine className="text-xl text-solana-purple dark:text-solana-teal" />
              <span>Help Guide</span>
            </button>
            
            <button 
              onClick={toggleDarkMode} 
              className="flex items-center gap-2 px-4 py-2 w-full rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
            >
              {darkMode ? (
                <>
                  <RiSunLine className="text-xl text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <RiMoonLine className="text-xl text-indigo-600" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>
        </aside>
        
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 w-full">
          <Link to="/" className="flex items-center gap-2">
            <SiSolana className="text-2xl text-solana-purple" />
            <h1 className="font-bold text-lg text-gray-900 dark:text-white">Solana Forensics</h1>
          </Link>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={openGuide}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <RiQuestionLine className="text-xl text-solana-purple dark:text-solana-teal" />
            </button>
            
            <button 
              onClick={toggleDarkMode} 
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {darkMode ? (
                <RiSunLine className="text-xl text-amber-400" />
              ) : (
                <RiMoonLine className="text-xl text-indigo-600" />
              )}
            </button>
            
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {mobileMenuOpen ? (
                <RiCloseLine className="text-xl" />
              ) : (
                <RiMenuLine className="text-xl" />
              )}
            </button>
          </div>
        </header>
        
        {/* Mobile navigation menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden fixed top-[73px] left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800"
            >
              <nav className="p-4 space-y-1">
                <NavLink to="/" icon={<RiBankLine />} label="Dashboard" />
                <NavLink to="/transaction-flow" icon={<RiFlowChart />} label="Transaction Flow" />
                <NavLink to="/wallet-analysis" icon={<RiWalletLine />} label="Wallet Analysis" />
                <NavLink to="/entity-labels" icon={<RiUserSearchLine />} label="Entity Labels" />
                <NavLink to="/transaction-clustering" icon={<RiGroupLine />} label="Transaction Clustering" />
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
              className="p-4 md:p-6 h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      
      {/* Guide Modal */}
      <GuideModal isOpen={isOpen} onClose={onClose} />
    </div>
  );
} 