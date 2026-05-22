import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES } from '../theme/themes';

const ThemeContext = createContext(null);

const STORAGE_KEY = '@fitness_theme';

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState('dark');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => { if (stored && THEMES[stored]) setThemeId(stored); })
      .catch(() => {});
  }, []);

  const setTheme = async (id) => {
    if (!THEMES[id]) return;
    setThemeId(id);
    try { await AsyncStorage.setItem(STORAGE_KEY, id); } catch {}
  };

  return (
    <ThemeContext.Provider value={{
      themeId,
      colors: THEMES[themeId].colors,
      setTheme,
      themes: THEMES,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
