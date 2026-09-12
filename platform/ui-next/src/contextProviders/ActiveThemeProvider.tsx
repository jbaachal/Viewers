import * as React from 'react';
import '../themes/themes.css';
import { themePresets } from '../themes';

const STORAGE_KEY_THEME = 'ohif:theme';
const STORAGE_KEY_CUSTOM_CSS = 'ohif:custom-theme-css';
const STORAGE_KEY_APPEARANCE = 'ohif:appearance';
const CUSTOM_STYLE_ID = 'ohif-custom-theme';
const VALID_THEMES = new Set(['default', 'custom', ...themePresets.map(p => p.name)]);

export type AppearanceMode = 'light' | 'dark' | 'system';

const VALID_APPEARANCE_MODES = new Set<AppearanceMode>(['light', 'dark', 'system']);
const DARK_MODE_MEDIA_QUERY = '(prefers-color-scheme: dark)';

type ActiveThemeContextType = {
  activeTheme: string;
  setActiveTheme: (theme: string) => void;
  customCss: string;
  applyCustomTheme: (cssText: string) => boolean;
  clearCustomTheme: () => void;
  appearanceMode: AppearanceMode;
  resolvedAppearance: Exclude<AppearanceMode, 'system'>;
  setAppearanceMode: (mode: AppearanceMode) => void;
};

function getStoredAppearance(): AppearanceMode {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem(STORAGE_KEY_APPEARANCE) as AppearanceMode | null;
  return stored && VALID_APPEARANCE_MODES.has(stored) ? stored : 'dark';
}

function resolveAppearance(mode: AppearanceMode): Exclude<AppearanceMode, 'system'> {
  if (mode !== 'system') return mode;
  return window.matchMedia?.(DARK_MODE_MEDIA_QUERY).matches ? 'dark' : 'light';
}

function applyAppearance(mode: AppearanceMode): Exclude<AppearanceMode, 'system'> {
  const resolved = resolveAppearance(mode);
  document.body.classList.remove('light', 'dark');
  document.body.classList.add(resolved);
  document.documentElement.style.colorScheme = resolved;
  return resolved;
}

/** Applies the saved appearance before React finishes booting to avoid a theme flash. */
export function initializeAppearance() {
  if (typeof document === 'undefined') return;
  applyAppearance(getStoredAppearance());
}

// 'custom' is deliberately not URL-addressable: the CSS behind it lives only in
// the visitor's own localStorage, so a ?theme=custom link cannot reproduce a look
// and would only strand the app in a custom state with no CSS behind it.
function isValidUrlTheme(theme: string | null): theme is string {
  return !!theme && theme !== 'custom' && VALID_THEMES.has(theme);
}

const ActiveThemeContext = React.createContext<ActiveThemeContextType | undefined>(undefined);

function removeThemeClasses() {
  const classList = document.body.classList;
  const toRemove: string[] = [];
  classList.forEach(cls => {
    if (cls.startsWith('theme-')) {
      toRemove.push(cls);
    }
  });
  toRemove.forEach(cls => classList.remove(cls));
}

function removeCustomStyleElement() {
  const style = document.getElementById(CUSTOM_STYLE_ID);
  if (style) {
    style.remove();
  }
}

function parseCssVars(cssText: string): string[] {
  const vars: string[] = [];

  // Remove comment spans entirely (text included), then any unterminated tail,
  // so comment contents never bleed into a variable value.
  const stripped = cssText.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\*[\s\S]*$/, '');

  // Split on newlines AND semicolons so single-line/minified CSS parses too.
  for (const raw of stripped.split(/[\n;]/)) {
    let line = raw.trim();

    // Tolerate a selector prefix on the same segment, e.g. ":root {" or ".dark{".
    const braceIdx = line.lastIndexOf('{');
    if (braceIdx !== -1) {
      line = line.slice(braceIdx + 1).trim();
    }

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const name = line.slice(0, colonIdx).trim();
    if (!/^--[a-zA-Z0-9-]+$/.test(name)) continue;

    const value = line
      .slice(colonIdx + 1)
      .replace(/[{}]/g, '')
      .trim();
    if (!value) continue;

    // Token values are plain HSL triplets — parentheses are never legitimate,
    // and rejecting them keeps url(...) out of the injected stylesheet even if
    // a future rule ever consumes a token outside hsl().
    if (value.includes('(') || value.includes(')')) continue;

    vars.push(`  ${name}: ${value};`);
  }

  return vars;
}

function injectCustomStyles(vars: string[]) {
  const block = vars.join('\n');
  const css = `:root {\n${block}\n}\n.dark {\n${block}\n}`;

  let style = document.getElementById(CUSTOM_STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = CUSTOM_STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = css;
}

export function ActiveThemeProvider({ children }: { children: React.ReactNode }) {
  const [appearanceMode, setAppearanceModeState] = React.useState<AppearanceMode>(() =>
    getStoredAppearance()
  );
  const [resolvedAppearance, setResolvedAppearance] = React.useState<
    Exclude<AppearanceMode, 'system'>
  >(() => (typeof document === 'undefined' ? 'dark' : applyAppearance(getStoredAppearance())));

  const [activeTheme, setActiveThemeState] = React.useState<string>(() => {
    if (typeof window === 'undefined') return 'default';
    const urlTheme = new URLSearchParams(window.location.search).get('theme');
    if (isValidUrlTheme(urlTheme)) return urlTheme;

    // Validate the stored value the same way the URL param is validated — a stale
    // key (renamed preset, older build) must not become a theme-* body class.
    const stored = localStorage.getItem(STORAGE_KEY_THEME);
    if (!stored || !VALID_THEMES.has(stored)) return 'default';
    if (stored === 'custom' && !localStorage.getItem(STORAGE_KEY_CUSTOM_CSS)) return 'default';
    return stored;
  });

  const [customCss, setCustomCssState] = React.useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(STORAGE_KEY_CUSTOM_CSS) || '';
  });

  const setActiveTheme = React.useCallback((theme: string) => {
    if (!VALID_THEMES.has(theme)) return;

    setActiveThemeState(theme);
    removeThemeClasses();

    if (theme !== 'default' && theme !== 'custom') {
      document.body.classList.add(`theme-${theme}`);
    }

    if (theme !== 'custom') {
      removeCustomStyleElement();
    }

    if (theme === 'default') {
      localStorage.removeItem(STORAGE_KEY_THEME);
    } else {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    }
  }, []);

  const applyCustomTheme = React.useCallback((cssText: string): boolean => {
    const vars = parseCssVars(cssText);
    if (vars.length === 0) return false;

    injectCustomStyles(vars);

    setCustomCssState(cssText);
    localStorage.setItem(STORAGE_KEY_CUSTOM_CSS, cssText);

    setActiveThemeState('custom');
    removeThemeClasses();
    localStorage.setItem(STORAGE_KEY_THEME, 'custom');
    return true;
  }, []);

  const clearCustomTheme = React.useCallback(() => {
    removeCustomStyleElement();

    setCustomCssState('');
    localStorage.removeItem(STORAGE_KEY_CUSTOM_CSS);

    setActiveThemeState('default');
    removeThemeClasses();
    localStorage.removeItem(STORAGE_KEY_THEME);
  }, []);

  const setAppearanceMode = React.useCallback((mode: AppearanceMode) => {
    if (!VALID_APPEARANCE_MODES.has(mode)) return;
    localStorage.setItem(STORAGE_KEY_APPEARANCE, mode);
    setAppearanceModeState(mode);
    setResolvedAppearance(applyAppearance(mode));
  }, []);

  React.useEffect(() => {
    setResolvedAppearance(applyAppearance(appearanceMode));
    if (appearanceMode !== 'system' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia(DARK_MODE_MEDIA_QUERY);
    const handleSystemAppearanceChange = () => setResolvedAppearance(applyAppearance('system'));
    mediaQuery.addEventListener?.('change', handleSystemAppearanceChange);
    return () => mediaQuery.removeEventListener?.('change', handleSystemAppearanceChange);
  }, [appearanceMode]);

  // Persist URL param override to localStorage
  React.useEffect(() => {
    const urlTheme = new URLSearchParams(window.location.search).get('theme');
    if (isValidUrlTheme(urlTheme)) {
      if (urlTheme === 'default') {
        localStorage.removeItem(STORAGE_KEY_THEME);
      } else {
        localStorage.setItem(STORAGE_KEY_THEME, urlTheme);
      }
    }
  }, []);

  // Apply initial theme on mount (including custom theme re-injection on reload)
  React.useEffect(() => {
    if (activeTheme === 'custom' && customCss) {
      applyCustomTheme(customCss);
    } else if (activeTheme !== 'default') {
      document.body.classList.add(`theme-${activeTheme}`);
    }

    return () => {
      removeThemeClasses();
      removeCustomStyleElement();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value = React.useMemo(
    () => ({
      activeTheme,
      setActiveTheme,
      customCss,
      applyCustomTheme,
      clearCustomTheme,
      appearanceMode,
      resolvedAppearance,
      setAppearanceMode,
    }),
    [
      activeTheme,
      setActiveTheme,
      customCss,
      applyCustomTheme,
      clearCustomTheme,
      appearanceMode,
      resolvedAppearance,
      setAppearanceMode,
    ]
  );

  return <ActiveThemeContext.Provider value={value}>{children}</ActiveThemeContext.Provider>;
}

export function useActiveTheme() {
  const context = React.useContext(ActiveThemeContext);
  if (context === undefined) {
    throw new Error('useActiveTheme must be used within an ActiveThemeProvider');
  }
  return context;
}
