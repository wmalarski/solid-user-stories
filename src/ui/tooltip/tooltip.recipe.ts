import { tv } from "tailwind-variants";

export const tooltipRecipe = tv({
  base: "tooltip",
  variants: {
    color: {
      accent: "tooltip-accent",
      error: "tooltip-error",
      info: "tooltip-info",
      neutral: "tooltip-neutral",
      primary: "tooltip-primary",
      secondary: "tooltip-secondary",
      success: "tooltip-success",
      warning: "tooltip-warning",
    },
    open: {
      false: "",
      true: "tooltip-open",
    },
    placement: {
      bottom: "tooltip-bottom",
      left: "tooltip-left",
      right: "tooltip-right",
      top: "tooltip-top",
    },
  },
});

export const tooltipContentRecipe = tv({
  base: "tooltip-content",
});
