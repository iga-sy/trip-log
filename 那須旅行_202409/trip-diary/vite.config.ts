import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pagesのプロジェクトサイト配下でもカスタムドメインでも
// 同じビルド成果物で動くよう相対パスを採用する。
export default defineConfig({
  base: "./",
  plugins: [react()],
});
