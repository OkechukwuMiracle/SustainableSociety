import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface UseAutoLogoutProps {
  timeout?: number; // logout timeout in milliseconds (default: 8 hours)
  warningTime?: number; // time before logout to show warning in milliseconds (default: 15 minutes)
}

export const useAutoLogout = ({
  timeout = 8 * 60 * 60 * 1000, // 8 hours by default
  warningTime = 15 * 60 * 1000, // 15 minutes warning before logout
}: UseAutoLogoutProps = {}) => {
  const { logout } = useAuth();
  const { toast } = useToast();
  
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  
  const logoutTimerRef = useRef<number | undefined>();
  const warningTimerRef = useRef<number | undefined>();
  const countdownIntervalRef = useRef<number | undefined>();

  const resetTimers = () => {
    // Clear existing timers
    if (logoutTimerRef.current) window.clearTimeout(logoutTimerRef.current);
    if (warningTimerRef.current) window.clearTimeout(warningTimerRef.current);
    if (countdownIntervalRef.current) window.clearInterval(countdownIntervalRef.current);

    // Hide warning if showing
    setShowWarning(false);
    setTimeRemaining(null);

    // Set new timers
    warningTimerRef.current = window.setTimeout(() => {
      setShowWarning(true);
      setTimeRemaining(warningTime);
      
      // Start countdown
      countdownIntervalRef.current = window.setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 0) return 0;
          return prev - 1000;
        });
      }, 1000);
      
      toast({
        title: "Auto-logout warning",
        description: `You will be logged out in ${Math.round(warningTime / 60000)} minutes due to inactivity. Please complete your face scan to continue working.`,
        duration: warningTime,
      });
    }, timeout - warningTime);

    // Set logout timer
    logoutTimerRef.current = window.setTimeout(() => {
      logout().catch(console.error);
    }, timeout);
  };

  useEffect(() => {
    // Initialize timers on mount
    resetTimers();

    // Reset timers on user activity
    const handleActivity = () => {
      // Only reset if we're not in warning period to avoid resetting during warning
      if (!showWarning) {
        resetTimers();
      }
    };

    // Track user activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    // Cleanup on unmount
    return () => {
      if (logoutTimerRef.current) window.clearTimeout(logoutTimerRef.current);
      if (warningTimerRef.current) window.clearTimeout(warningTimerRef.current);
      if (countdownIntervalRef.current) window.clearInterval(countdownIntervalRef.current);
      
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [logout, showWarning]);

  const formatTimeRemaining = () => {
    if (timeRemaining === null) return '';
    
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const cancelLogout = () => {
    resetTimers();
  };

  return {
    showWarning,
    timeRemaining: formatTimeRemaining(),
    cancelLogout,
  };
};
