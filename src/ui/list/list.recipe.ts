import { tv } from "tailwind-variants";

export const listRecipe = tv({
  base: "list bg-base-100 rounded-box shadow-md",
});

export const listRowRecipe = tv({ base: "list-row" });

export const listColumnRecipe = tv({
  variants: {
    grow: {
      true: "list-col-grow",
    },
    wrap: {
      true: "list-col-wrap",
    },
  },
});
