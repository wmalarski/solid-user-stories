import { defineConfig } from "vite";
import devtools from "solid-devtools/vite";
import solidPlugin from "vite-plugin-solid";

// oxlint-disable-next-line no-default-export
export default defineConfig({
  build: {
    target: "esnext",
  },
  plugins: [devtools(), solidPlugin()],
  server: {
    port: 3000,
  },
});
