const { RADIUS } = require("./constants/theme.ts");

// Convert the RADIUS object (numbers) to Tailwind format (pixel strings)
const borderRadiusConfig = Object.entries(RADIUS).reduce((acc, [key, value]) => {
  acc[key] = `${value}px`;
  return acc;
}, {});

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
        "lobster":          ["LobsterTwo_400Regular"],
        "lobster-bold":     ["LobsterTwo_700Bold"],
        "lobster-italic":   ["LobsterTwo_400Regular_Italic"],
        "lobster-bold-italic": ["LobsterTwo_700Bold_Italic"],
      },
      borderRadius: borderRadiusConfig,
    },
  },
  plugins: [],
};
