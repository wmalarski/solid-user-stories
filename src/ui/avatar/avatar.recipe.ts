import { tv } from "tailwind-variants";

export const avatarRecipe = tv({
  base: "avatar",
  variants: {
    offline: {
      false: "",
      true: "avatar-offline",
    },
    online: {
      false: "",
      true: "avatar-online",
    },
    placeholder: {
      false: "",
      true: "avatar-placeholder",
    },
  },
});

export const avatarContentRecipe = tv({
  base: "w-8 rounded-full",
});

export const avatarGroupRecipe = tv({
  base: "avatar-group",
});
