import tailwindcss from "@tailwindcss/vite";
import devtools from "solid-devtools/vite";
import sonda from "sonda/vite";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import viteTsConfigPaths from "vite-tsconfig-paths";

// oxlint-disable-next-line no-default-export
export default defineConfig({
  build: {
    sourcemap: true,
    target: "esnext",
  },
  plugins: [
    devtools(),
    sonda({ enabled: true, open: false }),
    viteTsConfigPaths(),
    solidPlugin(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
  },
});
