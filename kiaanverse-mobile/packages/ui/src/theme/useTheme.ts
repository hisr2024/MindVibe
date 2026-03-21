/**
 * Hook to access the current theme from ThemeContext.
 */

import { useContext } from 'react';
import { ThemeContext } from './ThemeProvider';

export function useTheme() {
  const context = useContext(ThemeContext);
  return context;
}
