export const THEMES = {
  dark: {
    name: 'Dark Navy (Default)',
    vars: {
      '--bg-primary': '#030712',
      '--bg-secondary': '#060b19',
      '--card-bg': 'rgba(15, 23, 42, 0.75)',
      '--card-border': 'rgba(255, 255, 255, 0.12)',
      '--text-primary': '#f8fafc',
      '--text-secondary': '#cbd5e1',
      '--text-muted': '#94a3b8',
      '--accent': '#0284c7'
    }
  },
  light: {
    name: 'Clinical Light',
    vars: {
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#f8fafc',
      '--card-bg': '#ffffff',
      '--card-border': '#cbd5e1',
      '--text-primary': '#0f172a',
      '--text-secondary': '#334155',
      '--text-muted': '#64748b',
      '--accent': '#0284c7'
    }
  }
};

export function applyTheme(themeKey = 'dark') {
  const theme = THEMES[themeKey] || THEMES.dark;
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([prop, val]) => {
    root.style.setProperty(prop, val);
  });

  if (themeKey === 'light') {
    root.classList.add('light-theme');
    root.setAttribute('data-theme', 'light');
  } else {
    root.classList.remove('light-theme');
    root.setAttribute('data-theme', 'dark');
  }

  localStorage.setItem('admin-theme', themeKey);
}
