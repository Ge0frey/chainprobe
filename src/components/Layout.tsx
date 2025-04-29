import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  RiDashboardLine, 
  RiFlowChart, 
  RiWalletLine, 
  RiUserSearchLine, 
  RiGroupLine, 
  RiRadarLine,
  RiMenuLine,
  RiCloseLine,
  RiMoonLine,
  RiSunLine,
  RiShieldCheckLine,
  RiExchangeLine,
  RiQuestionLine,
  RiAlertLine,
  RiShieldStarLine
} from 'react-icons/ri';
import { SiSolana } from 'react-icons/si';
import { GuideModal } from './ui/GuideModal';
import { useGuideModal } from './ui/useGuideModal';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { isOpen: isGuideOpen, onClose: onGuideClose, openGuide } = useGuideModal();

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-40 w-64 h-screen transition-transform ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="h-full px-3 py-4 overflow-y-auto bg-card/50 backdrop-blur-md border-r border-border flex flex-col">
          {/* Logo */}
          <div className="flex items-center gap-2 px-4 mb-8">
            <SiSolana className="text-2xl text-solana-purple" />
            <span className="text-xl font-bold">ChainProbe</span>
          </div>

          {/* Navigation */}
          <div className="flex-1 space-y-8">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-600 dark:text-gray-500 font-medium pl-4 mb-2">Dashboard</p>
              <nav className="space-y-1 relative">
                <NavLink to="/dashboard" icon={<RiDashboardLine />} label="Overview" />
              </nav>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-gray-600 dark:text-gray-500 font-medium pl-4 mb-2">Analysis Tools</p>
              <nav className="space-y-1 relative">
                <NavLink to="/transaction-flow" icon={<RiFlowChart />} label="Transaction Flow" />
                <NavLink to="/wallet-analysis" icon={<RiWalletLine />} label="Wallet Analysis" />
                <NavLink to="/transaction-clustering" icon={<RiGroupLine />} label="Clustering" />
                <NavLink to="/pattern-analysis" icon={<RiRadarLine />} label="Pattern Analysis" />
              </nav>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-gray-600 dark:text-gray-500 font-medium pl-4 mb-2">Token Security</p>
              <nav className="space-y-1 relative">
                <NavLink to="/token-security/analyzer" icon={<RiShieldCheckLine />} label="Token Analyzer" />
                <NavLink to="/token-security/trending" icon={<RiRadarLine />} label="Trending Tokens" />
                <NavLink to="/token-security/new" icon={<RiAlertLine />} label="New Tokens" />
                <NavLink to="/token-security/verified" icon={<RiShieldCheckLine />} label="Verified Tokens" />
              </nav>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-gray-600 dark:text-gray-500 font-medium pl-4 mb-2">Other Tools</p>
              <nav className="space-y-1 relative">
                <NavLink to="/entity-labels" icon={<RiUserSearchLine />} label="Entity Labels" />
                <NavLink to="/smart-contract-scanner" icon={<RiShieldStarLine />} label="Contract Scanner" />
                <NavLink to="/bridge-monitor" icon={<RiExchangeLine />} label="Bridge Monitor" />
              </nav>
            </div>
          </div>

          {/* Settings and Help - Now at the bottom */}
          <div className="pt-4 border-t border-border mt-4">
            <p className="text-xs uppercase tracking-wider text-gray-600 dark:text-gray-500 font-medium pl-4 mb-2">Settings</p>
            <div className="space-y-1 px-4">
              <button
                onClick={toggleDarkMode}
                className="flex items-center gap-2 w-full px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300"
              >
                {isDarkMode ? <RiSunLine className="text-xl" /> : <RiMoonLine className="text-xl" />}
                <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              <button
                onClick={openGuide}
                className="flex items-center gap-2 w-full px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300"
              >
                <RiQuestionLine className="text-xl" />
                <span>Guide</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content wrapper */}
      <div className="lg:ml-64 min-h-screen flex flex-col">
        {/* Page content */}
        <main className="flex-1 relative">
          <Outlet />
        </main>
      </div>

      {/* Mobile menu button */}
      <button
        onClick={toggleMobileMenu}
        className="fixed bottom-4 left-4 z-50 lg:hidden p-3 rounded-full bg-card/50 backdrop-blur-md border border-border"
      >
        {isMobileMenuOpen ? (
          <RiCloseLine className="text-2xl" />
        ) : (
          <RiMenuLine className="text-2xl" />
        )}
      </button>

      {/* Guide Modal */}
      <GuideModal isOpen={isGuideOpen} onClose={onGuideClose} />
    </div>
  );
} 