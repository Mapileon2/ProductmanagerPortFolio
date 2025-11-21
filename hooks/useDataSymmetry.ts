import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

interface SymmetryStatus {
  isSymmetric: boolean;
  differences: string[];
  authenticatedCount: number;
  publicCount: number;
  lastChecked: Date | null;
  isChecking: boolean;
}

export const useDataSymmetry = () => {
  const [symmetryStatus, setSymmetryStatus] = useState<SymmetryStatus>({
    isSymmetric: true,
    differences: [],
    authenticatedCount: 0,
    publicCount: 0,
    lastChecked: null,
    isChecking: false
  });

  const checkSymmetry = useCallback(async () => {
    setSymmetryStatus(prev => ({ ...prev, isChecking: true }));
    
    try {
      const result = await api.verifyDataSymmetry();
      setSymmetryStatus({
        isSymmetric: result.isSymmetric,
        differences: result.differences,
        authenticatedCount: result.authenticatedCount,
        publicCount: result.publicCount,
        lastChecked: new Date(),
        isChecking: false
      });
      
      if (!result.isSymmetric) {
        console.warn('⚠️  Data symmetry issues detected:', result.differences);
      } else {
        console.log('✅ Data symmetry verified - authenticated and public data match');
      }
    } catch (error) {
      console.error('❌ Error checking data symmetry:', error);
      setSymmetryStatus(prev => ({
        ...prev,
        isChecking: false,
        differences: ['Error during symmetry check']
      }));
    }
  }, []);

  const ensureSymmetry = useCallback(async () => {
    try {
      await api.ensureDataSymmetry();
      // Re-check symmetry after ensuring it
      await checkSymmetry();
    } catch (error) {
      console.error('❌ Error ensuring data symmetry:', error);
    }
  }, [checkSymmetry]);

  // Auto-check symmetry on mount only
  // We removed the 30s polling interval to improve performance.
  // Realtime subscriptions in HomePage.tsx handle the "live" aspect.
  useEffect(() => {
    checkSymmetry();
  }, [checkSymmetry]);

  return {
    symmetryStatus,
    checkSymmetry,
    ensureSymmetry,
    isSymmetric: symmetryStatus.isSymmetric,
    hasIssues: symmetryStatus.differences.length > 0
  };
};