import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        line: {
          green: '#06C755',
          lightgreen: '#B5F1CC',
          bg: '#F6F6F6',
        },
        chat: {
          received: '#F0F0F0',
          sent: '#06C755',
          sentText: '#FFFFFF',
        },
      },
    },
  },
  plugins: [],
};

export default config;
