import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ColorValue } from 'react-native';
import { StatusBarStyle } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Theme definitions
export const LIGHT_THEME = {
  primary: '#007AFF',
  secondary: '#FF3B30',
  tertiary: '#34C759',
  background: '#F7F7F7',
  card: '#FFFFFF',
  text: '#111111',
  textSecondary: '#8E8E93',
  placeholder: '#C7C7CC',
  border: '#E1E1E1',
  shadow: {
    color: '#000000',
    opacity: 0.08,
  },
  bubble: {
    user: '#007AFF',
    bot: '#F2F2F7',
  },
  navbar: '#FFFFFF',
  gradient: ['#F8F8F8', '#F4F6F8', '#F7F7F7'] as readonly [ColorValue, ColorValue, ...ColorValue[]],
  statusBarStyle: 'dark' as StatusBarStyle,
};

export const DARK_THEME = {
  primary: '#0A84FF',
  secondary: '#FF453A',
  tertiary: '#30D158',
  background: '#171717',
  card: '#262626',
  text: '#FFFFFF',
  textSecondary: '#A3A3A3',
  placeholder: '#525252',
  border: '#404040',
  shadow: {
    color: '#000000',
    opacity: 0.4,
  },
  bubble: {
    user: '#0A84FF',
    bot: '#404040',
  },
  navbar: '#262626',
  gradient: ['#171717', '#1A1A1A', '#171717'] as readonly [ColorValue, ColorValue, ...ColorValue[]],
  statusBarStyle: 'light' as StatusBarStyle,
};

export type Theme = {
  primary: string;
  secondary: string;
  tertiary: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  placeholder: string;
  border: string;
  shadow: {
    color: string;
    opacity: number;
  };
  bubble: {
    user: string;
    bot: string;
  };
  navbar: string;
  gradient: readonly [ColorValue, ColorValue, ...ColorValue[]];
  statusBarStyle: StatusBarStyle;
};

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [theme, setTheme] = useState<Theme>(LIGHT_THEME);

  // Load theme preference on app start
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Update theme when isDarkMode changes
  useEffect(() => {
    setTheme(isDarkMode ? DARK_THEME : LIGHT_THEME);
  }, [isDarkMode]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('isDarkMode');
      if (savedTheme !== null) {
        const isDark = JSON.parse(savedTheme);
        setIsDarkMode(isDark);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      await AsyncStorage.setItem('isDarkMode', JSON.stringify(newTheme));
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const value: ThemeContextType = {
    theme,
    isDarkMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
