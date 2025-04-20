import { useState, useEffect } from 'react';

// Key for storing the guide modal preferences in local storage
const GUIDE_MODAL_PREFS_KEY = 'solana-forensic-guide-prefs';

interface GuidePreferences {
  hasSeenGuide: boolean;
  lastSeenVersion: string;
}

// The current version of the guide - increment this when making significant changes
// to force the guide to show again for users who have seen previous versions
const CURRENT_GUIDE_VERSION = '1.0.0';

export function useGuideModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check if the user has seen the guide before
  useEffect(() => {
    try {
      const savedPrefs = localStorage.getItem(GUIDE_MODAL_PREFS_KEY);
      
      if (savedPrefs) {
        const prefs = JSON.parse(savedPrefs) as GuidePreferences;
        
        // If the user hasn't seen this version yet, show the guide
        if (!prefs.hasSeenGuide || prefs.lastSeenVersion !== CURRENT_GUIDE_VERSION) {
          setIsOpen(true);
        }
      } else {
        // If no preferences are stored, this is a new user, so show the guide
        setIsOpen(true);
      }
    } catch (error) {
      // If there's an error reading from localStorage, show the guide anyway
      setIsOpen(true);
    }
    
    setIsInitialized(true);
  }, []);
  
  // Mark the guide as seen when closed
  const onClose = () => {
    setIsOpen(false);
    
    try {
      const prefs: GuidePreferences = {
        hasSeenGuide: true,
        lastSeenVersion: CURRENT_GUIDE_VERSION
      };
      
      localStorage.setItem(GUIDE_MODAL_PREFS_KEY, JSON.stringify(prefs));
    } catch (error) {
      console.error('Failed to save guide preferences to localStorage', error);
    }
  };
  
  // Function to manually open the guide
  const openGuide = () => {
    setIsOpen(true);
  };
  
  return {
    isOpen,
    onClose,
    openGuide,
    isInitialized
  };
} 