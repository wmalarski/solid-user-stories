import { tv } from "tailwind-variants";

export const modalRecipe = tv({
  base: "modal",
  defaultVariants: {},
  variants: {
    horizontal: {
      end: "modal-end",
      start: "modal-start",
    },
    open: {
      true: "modal-open",
    },
    vertical: {
      bottom: "modal-bottom",
      middle: "modal-middle",
      top: "modal-top",
    },
  },
});

export const modalBoxRecipe = tv({ base: "modal-box" });

export const modalBackdropRecipe = tv({ base: "modal-backdrop" });

export const modalActionRecipe = tv({ base: "modal-action" });

export const modalTitleRecipe = tv({ base: "pb-4 text-xl" });

export const modalDescriptionRecipe = tv({ base: "pb-4 text-sm opacity-70" });
