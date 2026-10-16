import { createContext, useContext } from 'react';

/** The theme switch on Settings, shared with the root layout that applies it. */
export const DarkModeContext = createContext<{ dark: boolean; setDark(dark: boolean): void }>({
  dark: false,
  setDark: () => {},
});

export function useDarkMode() {
  return useContext(DarkModeContext);
}
