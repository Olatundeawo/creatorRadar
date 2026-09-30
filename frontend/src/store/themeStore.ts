import { create } from 'zustand';

interface ThemeStore {
  isDark: boolean;
  setDark: (isDark: boolean) => void;
  toggleDark: () => void;
}

export const useThemeStore = create<ThemeStore>((set) => {
  // Get initial preference from localStorage or system
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialDark = savedTheme ? savedTheme === 'dark' : prefersDark;

  // Set initial dark mode
  if (initialDark) {
    document.documentElement.classList.add('dark');
  }

  return {
    isDark: initialDark,
    
    setDark: (isDark) => {
      set({ isDark });
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      
      // Update DOM
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    
    toggleDark: () => {
      set((state) => {
        const newDark = !state.isDark;
        localStorage.setItem('theme', newDark ? 'dark' : 'light');
        
        // Update DOM
        if (newDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        return { isDark: newDark };
      });
    },
  };
});