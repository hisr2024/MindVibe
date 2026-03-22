/**
 * useNetworkStatus — reactive connectivity state via @react-native-community/netinfo.
 *
 * isOnline is true only when the device is both connected AND internet-reachable.
 * Cleans up the NetInfo subscription on unmount.
 */

import { useState, useEffect, useCallback } from 'react';
import NetInfo, { type NetInfoState, type NetInfoStateType } from '@react-native-community/netinfo';

export interface NetworkStatus {
  /** True when connected AND internet is reachable */
  isOnline: boolean;
  /** Connection type: wifi, cellular, ethernet, etc. */
  connectionType: NetInfoStateType | null;
  /** Whether we've received the first NetInfo callback */
  isInitialized: boolean;
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: true, // Optimistic default — assume online until proven otherwise
    connectionType: null,
    isInitialized: false,
  });

  const handleNetInfoChange = useCallback((state: NetInfoState) => {
    const isConnected = state.isConnected ?? false;
    const isReachable = state.isInternetReachable ?? isConnected;

    setStatus({
      isOnline: isConnected && isReachable,
      connectionType: state.type,
      isInitialized: true,
    });
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(handleNetInfoChange);
    return () => {
      unsubscribe();
    };
  }, [handleNetInfoChange]);

  return status;
}
