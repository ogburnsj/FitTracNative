import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BOLD = {
  name: 'bold',
  bgPage:   '#0d0d11',
  bgCard:   '#17171f',
  bgCard2:  '#1e1e28',
  bgInput:  '#1e1e28',
  bgNav:    '#0d0d11',
  bgModal:  '#17171f',
  border:   'rgba(255,255,255,0.07)',
  textPri:  '#f0f0f8',
  textSec:  '#666680',
  textMuted:'#44445a',
  tabActive: '#2d6a4f',
  tabIdle:   '#33334a',
  progTrack: '#1e1e28',
  accent:    '#2d6a4f',
  accentDim: 'rgba(45,106,79,0.15)',
  cardRadius: 12,
  shadow: null,
};

const MINIMAL = {
  name: 'minimal',
  bgPage:   '#f7f7f5',
  bgCard:   '#ffffff',
  bgCard2:  '#f0f0ee',
  bgInput:  '#f0f0ee',
  bgNav:    '#ffffff',
  bgModal:  '#ffffff',
  border:   'rgba(0,0,0,0.08)',
  textPri:  '#111111',
  textSec:  '#888888',
  textMuted:'#bbbbbb',
  tabActive: '#2d6a4f',
  tabIdle:   '#cccccc',
  progTrack: '#e8e8e4',
  accent:    '#2d6a4f',
  accentDim: 'rgba(45,106,79,0.15)',
  cardRadius: 16,
  shadow: {shadowColor:'#000',shadowOffset:{width:0,height:1},shadowOpacity:0.05,shadowRadius:2,elevation:1},
};

const ThemeContext = createContext({ theme: BOLD, setThemeName: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(BOLD);

  useEffect(() => {
    AsyncStorage.getItem('fittrac_theme').then(saved => {
      if (saved === 'minimal') setTheme(MINIMAL);
      else setTheme(BOLD);
    });
  }, []);

  function setThemeName(name) {
    const next = name === 'minimal' ? MINIMAL : BOLD;
    setTheme(next);
    AsyncStorage.setItem('fittrac_theme', name);
  }

  return (
    <ThemeContext.Provider value={{ theme, setThemeName }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
