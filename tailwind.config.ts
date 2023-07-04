import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  //darkMode: 'class',
  theme: {
    extend: {
      colors: {
        blue: {
          850: '#00278D',
        },
        red: {
          750: 'd44131',
        },     
      },
    },
  },
  plugins: [],
} satisfies Config;
