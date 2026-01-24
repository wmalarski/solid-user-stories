import {
  type Component,
  type ParentProps,
  createContext,
  createRenderEffect,
  createSignal,
  useContext,
} from "solid-js";
import * as v from "valibot";

const APP_THEME_COOKIE_NAME = "AppTheme";
const LIGHT_THEME_KEY = "sus-theme-light";
const DARK_THEME_KEY = "sus-theme-dark";

const appThemeSchema = () => {
  return v.union([v.literal(LIGHT_THEME_KEY), v.literal(DARK_THEME_KEY)]);
};

export type AppTheme = v.InferOutput<ReturnType<typeof appThemeSchema>>;

const APP_THEME_MAP: Record<AppTheme, string> = {
  "sus-theme-dark": "dark",
  "sus-theme-light": "silk",
};

const getClientAppTheme = () => {
  if (document.cookie.includes(DARK_THEME_KEY)) {
    return DARK_THEME_KEY;
  } else if (document.cookie.includes(LIGHT_THEME_KEY)) {
    return LIGHT_THEME_KEY;
  }
};

const setDOMTheme = (theme?: AppTheme) => {
  const htmlElement = document.querySelector("html");
  if (htmlElement) {
    htmlElement.dataset.theme = theme ? APP_THEME_MAP[theme] : undefined;
  }
};

const createThemeValue = () => {
  const initialThemeValue = getClientAppTheme();

  const [theme, setTheme] = createSignal(initialThemeValue);

  createRenderEffect(() => {
    setDOMTheme(initialThemeValue);
  });

  const updateTheme = (theme: AppTheme) => {
    setDOMTheme(theme);
    // oxlint-disable-next-line unicorn/no-document-cookie
    document.cookie = `${APP_THEME_COOKIE_NAME}=${theme}`;
    setTheme(theme);
  };

  return [theme, { updateTheme }] as const;
};

type ThemeContextValue = ReturnType<typeof createThemeValue>;

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: Component<ParentProps> = (props) => {
  const value = createThemeValue();

  return <ThemeContext.Provider value={value}>{props.children}</ThemeContext.Provider>;
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("ThemeContext is not defined");
  }

  return context;
};
