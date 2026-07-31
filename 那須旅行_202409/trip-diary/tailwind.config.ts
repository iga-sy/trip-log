import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: "#D2986A",
        base: "#FFF6EC",
        ink: "#4B4D37",
      },
    },
  },
  plugins: [],
} satisfies Config;
