import { createMemo, type Component } from "solid-js";
import { MoonIcon } from "~/ui/icons/moon-icon";
import { SunIcon } from "~/ui/icons/sun-icon";
import { useI18n } from "../i18n";
import { useThemeContext } from "./theme-context";

export const ThemeToggle: Component = () => {
  const { t } = useI18n();

  const [theme, { updateTheme }] = useThemeContext();

  const isLight = createMemo(() => {
    return theme() === "sus-theme-light";
  });

  const onClick = () => {
    updateTheme(isLight() ? "sus-theme-dark" : "sus-theme-light");
  };

  return (
    <label class="btn btn-circle btn-sm swap swap-rotate">
      <input type="checkbox" onChange={onClick} checked={isLight()} />
      <SunIcon class="swap-on size-5" aria-label={t("theme.setLight")} />
      <MoonIcon class="swap-off size-5" aria-label={t("theme.setDark")} />
    </label>
  );
};
