import { defineConfig } from "wxt";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  srcDir: "src",
  manifestVersion: 3,
  manifest: {
    name: "Bol Bhai",
    description: "Talk live with friends over any tab while you game or browse.",
    permissions: ["storage"],
    action: {
      default_title: "Open Bol Bhai"
    }
  },
  vite: () => ({
    plugins: [react(), tailwindcss()]
  })
});
