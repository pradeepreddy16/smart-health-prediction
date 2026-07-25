export const THEMES = {
  navy: {
    name: 'Dark Navy (Default)',
    vars: {
      '--bg-primary': '#020617',
      '--bg-secondary': '#0f172a',
      '--card-bg': 'rgba(15, 23, 42, 0.75)',
      '--card-border': 'rgba(30, 41, 59, 0.8)',
      '--text-primary': '#f8fafc',
      '--text-secondary': '#cbd5e1',
      '--text-muted': '#94a3b8',
      '--input-bg': '#090d16',
      '--accent': '#0284c7'
    }
  },
  dark: {
    name: 'Dark Navy (Default)',
    vars: {
      '--bg-primary': '#020617',
      '--bg-secondary': '#0f172a',
      '--card-bg': 'rgba(15, 23, 42, 0.75)',
      '--card-border': 'rgba(30, 41, 59, 0.8)',
      '--text-primary': '#f8fafc',
      '--text-secondary': '#cbd5e1',
      '--text-muted': '#94a3b8',
      '--input-bg': '#090d16',
      '--accent': '#0284c7'
    }
  },
  teal: {
    name: 'Deep Teal',
    vars: {
      '--bg-primary': '#041c1e',
      '--bg-secondary': '#092c2e',
      '--card-bg': 'rgba(9, 44, 46, 0.75)',
      '--card-border': 'rgba(17, 75, 78, 0.8)',
      '--text-primary': '#f0fdfa',
      '--text-secondary': '#99f6e4',
      '--text-muted': '#5eead4',
      '--input-bg': '#021012',
      '--accent': '#0d9488'
    }
  },
  slate: {
    name: 'Warm Slate',
    vars: {
      '--bg-primary': '#18181b',
      '--bg-secondary': '#27272a',
      '--card-bg': 'rgba(39, 39, 42, 0.75)',
      '--card-border': 'rgba(63, 63, 70, 0.8)',
      '--text-primary': '#fafafa',
      '--text-secondary': '#e4e4e7',
      '--text-muted': '#a1a1aa',
      '--input-bg': '#0f0f11',
      '--accent': '#3b82f6'
    }
  },
  clinical: {
    name: 'Soft Clinical White',
    vars: {
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#ffffff',
      '--card-bg': '#ffffff',
      '--card-border': 'rgba(148, 163, 184, 0.35)',
      '--text-primary': '#0f172a',
      '--text-secondary': '#334155',
      '--text-muted': '#64748b',
      '--input-bg': '#ffffff',
      '--accent': '#0284c7'
    }
  },
  light: {
    name: 'Clinical Light',
    vars: {
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#ffffff',
      '--card-bg': '#ffffff',
      '--card-border': '#e2e8f0',
      '--text-primary': '#0f172a',
      '--text-secondary': '#334155',
      '--text-muted': '#64748b',
      '--input-bg': '#ffffff',
      '--accent': '#0284c7'
    }
  }
};

export function applyTheme(themeKey = 'navy') {
  const theme = THEMES[themeKey] || THEMES.navy;
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([prop, val]) => {
    root.style.setProperty(prop, val);
  });

  if (themeKey === 'light' || themeKey === 'clinical') {
    root.classList.add('light-theme');
    root.setAttribute('data-theme', 'light');
  } else {
    root.classList.remove('light-theme');
    root.setAttribute('data-theme', 'dark');
  }

  localStorage.setItem('app-theme', themeKey);
}
