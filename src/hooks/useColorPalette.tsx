import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ColorPalette {
  primary: string;      // turquoise/cyan
  secondary: string;    // pink
  accent: string;       // purple
  background: string;   // dark background
  headerBg: string;     // header background color when scrolled
  headerBorder: string; // header border color when scrolled
  headerText: string;   // header text color when scrolled
}

const DEFAULT_COLORS: ColorPalette = {
  primary: '#4fd1c5',      // turquoise hsl(174, 50%, 60%)
  secondary: '#d9548f',    // pink hsl(330, 65%, 60%)
  accent: '#7c4dff',       // purple hsl(260, 60%, 50%)
  background: '#0a0a0a',   // dark hsl(0, 0%, 4%)
  headerBg: '#0a0a0a',     // header background (same as main bg by default)
  headerBorder: '#1a1a1a', // subtle dark border
  headerText: '#f5f5f5',   // light text for scrolled header
};

const STORAGE_KEY = 'cfa-color-palette';

// Convert hex to HSL values for CSS variables
const hexToHsl = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0 0% 50%';
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

// Apply colors to CSS variables
const applyColors = (colors: ColorPalette) => {
  const root = document.documentElement;
  
  const primaryHsl = hexToHsl(colors.primary);
  const secondaryHsl = hexToHsl(colors.secondary);
  const accentHsl = hexToHsl(colors.accent);
  const bgHsl = hexToHsl(colors.background);
  const headerBgHsl = hexToHsl(colors.headerBg || DEFAULT_COLORS.headerBg);
  const headerBorderHsl = hexToHsl(colors.headerBorder || DEFAULT_COLORS.headerBorder);
  const headerTextHsl = hexToHsl(colors.headerText || DEFAULT_COLORS.headerText);
  
  // Primary colors (turquoise family)
  root.style.setProperty('--primary', primaryHsl);
  root.style.setProperty('--turquoise', primaryHsl);
  root.style.setProperty('--accent', primaryHsl);
  root.style.setProperty('--ring', primaryHsl);
  root.style.setProperty('--moss', primaryHsl);
  root.style.setProperty('--mint', primaryHsl);
  
  // Adjust border and input based on primary
  const borderHsl = hexToHsl(colors.primary).replace(/(\d+)%$/, (_, l) => `${Math.max(parseInt(l) - 35, 15)}%`);
  root.style.setProperty('--border', borderHsl);
  root.style.setProperty('--input', borderHsl);
  
  // Secondary/pink colors
  root.style.setProperty('--pink', secondaryHsl);
  
  // Accent/purple colors
  root.style.setProperty('--purple', accentHsl);
  
  // Background
  root.style.setProperty('--background', bgHsl);
  
  // Header colors (for scrolled state)
  root.style.setProperty('--header-bg', headerBgHsl);
  root.style.setProperty('--header-border', headerBorderHsl);
  root.style.setProperty('--header-text', headerTextHsl);
};

export const useColorPalette = () => {
  const [colors, setColors] = useState<ColorPalette>(DEFAULT_COLORS);
  const [savedColors, setSavedColors] = useState<ColorPalette>(DEFAULT_COLORS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadColors();
  }, []);

  useEffect(() => {
    if (!loading) {
      applyColors(colors);
    }
  }, [colors, loading]);

  const loadColors = async () => {
    // Try to load from page_content table first
    try {
      const { data } = await supabase
        .from('page_content')
        .select('content')
        .eq('section', 'colors')
        .maybeSingle();
      
      if (data?.content) {
        const loadedColors = JSON.parse(data.content);
        setColors(loadedColors);
        setSavedColors(loadedColors);
        applyColors(loadedColors);
      } else {
        // Fallback to localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setColors(parsed);
          setSavedColors(parsed);
          applyColors(parsed);
        }
      }
    } catch {
      // Fallback to localStorage on error
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setColors(parsed);
        setSavedColors(parsed);
        applyColors(parsed);
      }
    }
    setLoading(false);
  };

  // Apply colors visually without saving to database
  const previewColors = (newColors: ColorPalette) => {
    setColors(newColors);
    applyColors(newColors);
  };

  // Save colors to database (called when user clicks "Guardar Edits")
  const saveColors = async (newColors: ColorPalette) => {
    setColors(newColors);
    setSavedColors(newColors);
    applyColors(newColors);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newColors));
    
    // Try to save to database
    try {
      const { data: existing } = await supabase
        .from('page_content')
        .select('id')
        .eq('section', 'colors')
        .maybeSingle();
      
      if (existing) {
        await supabase
          .from('page_content')
          .update({ content: JSON.stringify(newColors) })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('page_content')
          .insert({
            section: 'colors',
            title: 'Paleta de Colores',
            content: JSON.stringify(newColors),
            is_visible: true
          });
      }
    } catch (error) {
      console.error('Error saving colors to database:', error);
    }
  };

  // Reset to original default colors (visual only, needs save to persist)
  const resetColors = () => {
    setColors(DEFAULT_COLORS);
    applyColors(DEFAULT_COLORS);
  };

  // Revert to last saved colors (discard pending changes)
  const revertColors = () => {
    setColors(savedColors);
    applyColors(savedColors);
  };

  return {
    colors,
    savedColors,
    previewColors,
    saveColors,
    resetColors,
    revertColors,
    loading,
    defaultColors: DEFAULT_COLORS
  };
};
