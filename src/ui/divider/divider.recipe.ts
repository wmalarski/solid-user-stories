import { tv } from "tailwind-variants";

export const dividerRecipe = tv({
  base: "divider",
  variants: {
    color: {
      accent: "divider-accent",
      error: "divider-error",
      info: "divider-info",
      neutral: "divider-neutral",
      primary: "divider-primary",
      secondary: "divider-secondary",
      success: "divider-success",
      warning: "divider-warning",
    },
    direction: {
      horizontal: "divider-horizontal",
      vertical: "divider-vertical",
    },
    placement: {
      end: "divider-end",
      start: "divider-start",
    },
  },
});
