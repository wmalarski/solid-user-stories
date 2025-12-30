import { tv } from "tailwind-variants";

export const cardRecipe = tv({
  base: "card bg-base-200",
  defaultVariants: {},
  variants: {
    imageFull: {
      true: "image-full",
    },
    side: {
      true: "card-side",
    },
    size: {
      lg: "card-lg",
      md: "card-md",
      sm: "card-sm",
      xl: "card-xl",
      xs: "card-xs",
    },
    variant: {
      bordered: "card-border",
      dash: "card-dash",
    },
  },
});

export const cardTitleRecipe = tv({ base: "card-title" });

export const cardBodyRecipe = tv({ base: "card-body" });

export const cardActionsRecipe = tv({
  base: "card-actions",
  defaultVariants: {},
  variants: {
    justify: {
      end: "justify-end",
    },
  },
});
