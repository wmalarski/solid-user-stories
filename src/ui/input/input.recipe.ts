import { tv } from "tailwind-variants";

export const inputRecipe = tv({
  base: "input validator",
  defaultVariants: {},
  variants: {
    color: {
      accent: "input-accent",
      error: "input-error",
      info: "input-info",
      neutral: "input-neutral",
      primary: "input-primary",
      secondary: "input-secondary",
      success: "input-success",
      warning: "input-warning",
    },
    size: {
      lg: "input-lg",
      md: "input-md",
      sm: "input-sm",
      xl: "input-xl",
      xs: "input-xs",
    },
    variant: {
      ghost: "input-ghost",
    },
    width: {
      full: "w-full",
    },
  },
});
