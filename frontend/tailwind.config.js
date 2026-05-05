module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        "primary":          "#143832",
        "accent-green":     "#DAF1DE",
        "background-light": "#F6F8F7",
        "background-dark":  "#141E1C",
      },
      fontFamily: {
        "display":          ["Inter_400Regular"],
        "display-medium":   ["Inter_500Medium"],
        "display-semibold": ["Inter_600SemiBold"],
        "display-bold":     ["Inter_700Bold"],
      },
      borderRadius: {
        DEFAULT: 8,
        "lg":    16,
        "xl":    24,
        "full":  9999,
      },
    },
  },
  plugins: [],
};
