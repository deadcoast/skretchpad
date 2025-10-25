// src/lib/theme-engine.ts
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export class ThemeEngine {
  private styleElement: HTMLStyleElement;
  private currentTheme: string = 'liquid-glass-dark';
  
  constructor() {
    // Create style element for theme CSS
    this.styleElement = document.createElement('style');
    this.styleElement.id = 'theme-variables';
    document.head.appendChild(this.styleElement);
    
    // Listen for hot-reload events
    listen('theme:reload', ({ payload }: { payload: { theme: string } }) => {
      this.applyTheme(payload.theme);
    });
  }
  
  async applyTheme(themeName: string) {
    try {
      // Get CSS variables from Rust backend
      const cssVars = await invoke<string>('load_theme', { 
        themeName 
      });
      
      // Apply with smooth transition
      this.transitionTheme(() => {
        this.styleElement.textContent = cssVars;
        this.currentTheme = themeName;
      });
      
      // Persist theme choice
      localStorage.setItem('theme', themeName);
      
    } catch (error) {
      console.error('Failed to apply theme:', error);
      throw error;
    }
  }
  
  private transitionTheme(applyFn: () => void) {
    // Get transition duration from CSS
    const duration = parseInt(
      getComputedStyle(document.documentElement)
        .getPropertyValue('--transition-slow')
    );
    
    // Add transition class
    document.body.classList.add('theme-transitioning');
    
    // Apply theme
    applyFn();
    
    // Remove transition class after animation
    setTimeout(() => {
      document.body.classList.remove('theme-transitioning');
    }, duration);
  }
  
  async listThemes(): Promise<string[]> {
    return await invoke('list_themes');
  }
  
  getCurrentTheme(): string {
    return this.currentTheme;
  }
}