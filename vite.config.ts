import { defineConfig } from "vite";
import devtools from "solid-devtools/vite";
import solidPlugin from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

// oxlint-disable-next-line no-default-export
export default defineConfig({
  build: {
    target: "esnext",
  },
  plugins: [devtools(), viteTsConfigPaths(), solidPlugin(), tailwindcss()],
  server: {
    port: 3000,
  },
});
