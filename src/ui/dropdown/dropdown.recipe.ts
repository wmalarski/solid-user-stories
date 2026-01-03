import { tv } from "tailwind-variants";

export const dropdownRecipe = tv({
  base: "dropdown",
  variants: {
    align: {
      center: "dropdown-center",
      end: "dropdown-end",
      start: "dropdown-start",
    },
    close: {
      false: "",
      true: "dropdown-close",
    },
    hover: {
      false: "",
      true: "dropdown-hover",
    },
    open: {
      false: "",
      true: "dropdown-open",
    },
    placement: {
      bottom: "dropdown-bottom",
      left: "dropdown-left",
      right: "dropdown-right",
      top: "dropdown-top",
    },
  },
});

export const dropdownContentRecipe = tv({
  base: "dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm",
});
