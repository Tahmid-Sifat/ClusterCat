import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1c2430",
        mint: "#dff4ea",
        coral: "#ff6b57",
        amber: "#f5b84b"
      }
    }
  },
  plugins: []
};

export default config;
