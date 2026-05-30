module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        "primary":          "#004D36",
        "primary-light":    "#006B4D",
        "accent-green":     "#E8F5E9",
        "background-light": "#F5F3F0",
        "background-dark":  "#2D3A2F",
        "surface":          "#FFFFFF",
        "text-dark":        "#2D3A2F",
        "text-muted":       "#5C6E60",
        "text-light":       "#819685",
        "border-soft":      "#E5E2DE",
      },
      fontFamily: {
        "display":          ["Inter_400Regular"],
        "display-medium":   ["Inter_500Medium"],
        "display-semibold": ["Inter_600SemiBold"],
        "display-bold":     ["Inter_700Bold"],
      },
      borderRadius: {
        DEFAULT: "8px",
        "lg":    "16px",
        "xl":    "24px",
        "2xl":   "28px",
        "3xl":   "32px",
        "full":  "9999px",
      },
    },
  },
  plugins: [],
};
