import { tv } from "tailwind-variants";

export const badgeRecipe = tv({
  base: "badge",
  defaultVariants: {},
  variants: {
    color: {
      accent: "badge-accent",
      error: "badge-error",
      info: "badge-info",
      neutral: "badge-neutral",
      primary: "badge-primary",
      secondary: "badge-secondary",
      success: "badge-success",
      warning: "badge-warning",
    },
    size: {
      lg: "badge-lg",
      md: "badge-md",
      sm: "badge-sm",
      xl: "badge-xl",
      xs: "badge-xs",
    },
    style: {
      dash: "badge-dash",
      ghost: "badge-ghost",
      outline: "badge-outline",
      soft: "badge-soft",
    },
  },
});
