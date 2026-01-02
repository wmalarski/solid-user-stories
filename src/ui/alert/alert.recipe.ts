import { tv } from "tailwind-variants";

export const alertRecipe = tv({
  base: "alert justify-start text-xs",
  defaultVariants: {},
  variants: {
    color: {
      error: "alert-error",
      info: "alert-info",
      success: "alert-success",
      warning: "alert-warning",
    },
    direction: {
      horizontal: "alert-horizontal",
      vertical: "alert-vertical",
    },
    variant: {
      dash: "alert-dash",
      outline: "alert-outline",
      soft: "alert-soft",
    },
  },
});
