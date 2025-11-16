'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'night' | 'day';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('night'); // Default to night mode
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('yuyutoon-theme') as Theme | null;
    if (savedTheme === 'day' || savedTheme === 'night') {
      setThemeState(savedTheme);
    }
  }, []);

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('yuyutoon-theme', theme);

      // Apply theme class to document root
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(prevTheme => prevTheme === 'night' ? 'day' : 'night');
  };

  // Prevent flash of wrong theme
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
