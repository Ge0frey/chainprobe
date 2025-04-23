import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
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
  RiQuestionLine,
  RiRadarLine,
  RiSearchLine,
  RiSettings4Line
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

const NavLink = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link 
      to={to} 
      className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden ${
        isActive 
          ? 'text-white' 
          : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'
      }`}
    >
      {isActive && (
        <motion.div
          layoutId="navBackground"
          className="absolute inset-0 bg-gradient-to-r from-solana-purple/90 to-solana-teal/90 dark:from-solana-purple/80 dark:to-solana-teal/80 rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
      <div className={`relative z-10 text-xl ${isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
        {icon}
      </div>
      <span className="relative z-10 font-medium">{label}</span>
    </Link>
  );
};

export default function Layout() {
  const [darkMode, setDarkMode] = useState(true); // Default to dark mode
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const { isOpen, onClose, openGuide } = useGuideModal();

  // Handle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Glass gradient strip at top */}
      <div className="h-1 w-full bg-gradient-solana"></div>
      
      {/* Main container */}
      <div className="flex flex-1">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex flex-col w-72 backdrop-blur-md bg-white/80 dark:bg-black/20 border-r border-gray-200/50 dark:border-white/5 overflow-y-auto">
          <div className="p-6">
            <Link to="/" className="flex items-center gap-3 mb-10">
              <div className="p-2 rounded-xl bg-gradient-to-br from-solana-purple to-solana-teal">
                <SiSolana className="text-xl text-white" />
              </div>
              <div>
                <h1 className="font-bold text-xl text-gray-900 dark:text-white leading-none">Solana</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Forensic Analysis</p>
              </div>
            </Link>
          
            <div className="space-y-1 mb-6">
              <p className="text-xs uppercase tracking-wider text-gray-600 dark:text-gray-500 font-medium pl-4 mb-2">Dashboard</p>
              <nav className="space-y-1 relative">
                <NavLink to="/dashboard" icon={<RiBankLine />} label="Overview" />
              </nav>
            </div>

            <div className="space-y-1 mb-6">
              <p className="text-xs uppercase tracking-wider text-gray-600 dark:text-gray-500 font-medium pl-4 mb-2">Analysis Tools</p>
              <nav className="space-y-1 relative">
                <NavLink to="/transaction-flow" icon={<RiFlowChart />} label="Transaction Flow" />
                <NavLink to="/wallet-analysis" icon={<RiWalletLine />} label="Wallet Analysis" />
                <NavLink to="/entity-labels" icon={<RiUserSearchLine />} label="Entity Labels" />
                <NavLink to="/transaction-clustering" icon={<RiGroupLine />} label="Clustering" />
                <NavLink to="/pattern-analysis" icon={<RiRadarLine />} label="Pattern Analysis" />
              </nav>
            </div>
          </div>
          
          <div className="mt-auto p-6 space-y-3">
            <button 
              onClick={openGuide} 
              className="flex items-center gap-2 px-4 py-3 w-full rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-all duration-200"
            >
              <RiQuestionLine className="text-xl text-solana-teal" />
              <span>Help Guide</span>
            </button>
            
            <button 
              onClick={toggleDarkMode} 
              className="flex items-center gap-2 px-4 py-3 w-full rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-all duration-200"
            >
              {!darkMode ? (
                <>
                  <RiMoonLine className="text-xl text-solana-purple" />
                  <span>Dark Mode</span>
                </>
              ) : (
                <>
                  <RiSunLine className="text-xl text-amber-400" />
                  <span>Light Mode</span>
                </>
              )}
            </button>
          </div>
        </aside>
        
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white/80 dark:bg-background border-b border-gray-200/50 dark:border-border sticky top-0 z-30">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-solana-purple to-solana-teal">
              <SiSolana className="text-lg text-white" />
            </div>
            <h1 className="font-bold text-lg text-gray-900 dark:text-white">Solana Forensics</h1>
          </Link>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleSearch}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <RiSearchLine className="text-xl text-gray-600 dark:text-gray-400" />
            </button>
            
            <button 
              onClick={openGuide}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <RiQuestionLine className="text-xl text-solana-teal" />
            </button>
            
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              {!darkMode ? (
                <RiMoonLine className="text-xl text-solana-purple" />
              ) : (
                <RiSunLine className="text-xl text-amber-400" />
              )}
            </button>
            
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              {mobileMenuOpen ? (
                <RiCloseLine className="text-xl text-gray-900 dark:text-white" />
              ) : (
                <RiMenuLine className="text-xl text-gray-900 dark:text-white" />
              )}
            </button>
          </div>
        </header>

        {/* Global search overlay */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed inset-0 bg-background/60 backdrop-blur-md z-50 flex items-start justify-center pt-20"
              onClick={() => setSearchOpen(false)}
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-xl p-2 bg-card border border-border rounded-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 p-3">
                  <RiSearchLine className="text-xl text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search wallets, transactions, or entities..."
                    className="bg-transparent border-none outline-none w-full text-foreground placeholder-muted-foreground"
                    autoFocus
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Mobile navigation menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="md:hidden fixed inset-y-0 right-0 z-40 w-64 bg-white/95 dark:bg-background/95 backdrop-blur-sm border-l border-gray-200/50 dark:border-border shadow-2xl"
            >
              <div className="p-5 h-full flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Navigation</p>
                  <button 
                    onClick={toggleMobileMenu}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
                  >
                    <RiCloseLine className="text-xl text-gray-900 dark:text-white" />
                  </button>
                </div>
                
                <nav className="space-y-1 mb-6">
                  <Link to="/dashboard" 
                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300"
                    onClick={toggleMobileMenu}
                  >
                    <RiBankLine className="text-xl" />
                    <span>Overview</span>
                  </Link>
                  <Link to="/transaction-flow"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300"
                    onClick={toggleMobileMenu}
                  >
                    <RiFlowChart className="text-xl" />
                    <span>Transaction Flow</span>
                  </Link>
                  <Link to="/wallet-analysis"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300"
                    onClick={toggleMobileMenu}
                  >
                    <RiWalletLine className="text-xl" />
                    <span>Wallet Analysis</span>
                  </Link>
                  <Link to="/entity-labels"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300"
                    onClick={toggleMobileMenu}
                  >
                    <RiUserSearchLine className="text-xl" />
                    <span>Entity Labels</span>
                  </Link>
                  <Link to="/transaction-clustering"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300"
                    onClick={toggleMobileMenu}
                  >
                    <RiGroupLine className="text-xl" />
                    <span>Transaction Clustering</span>
                  </Link>
                  <Link to="/pattern-analysis"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300"
                    onClick={toggleMobileMenu}
                  >
                    <RiRadarLine className="text-xl" />
                    <span>Pattern Analysis</span>
                  </Link>
                </nav>
                
                <div className="mt-auto flex flex-col gap-2">
                  <button 
                    onClick={() => { 
                      openGuide();
                      toggleMobileMenu();
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300"
                  >
                    <RiQuestionLine className="text-xl text-solana-teal" />
                    <span>Help Guide</span>
                  </button>
                  
                  <button 
                    onClick={toggleDarkMode}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300"
                  >
                    {!darkMode ? (
                      <>
                        <RiMoonLine className="text-xl text-solana-purple" />
                        <span>Dark Mode</span>
                      </>
                    ) : (
                      <>
                        <RiSunLine className="text-xl text-amber-400" />
                        <span>Light Mode</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
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
              className="p-6 md:p-10 h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      
      {/* Guide Modal */}
      <GuideModal isOpen={isOpen} onClose={onClose} />
    </div>
  );
} 