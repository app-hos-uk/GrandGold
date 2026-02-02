import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // GrandGold brand colors (based on thegrandgold.com)
        gold: {
          50: '#FFF9E6',
          100: '#FFF0C2',
          200: '#FFE699',
          300: '#FFD966',
          400: '#FFCC33',
          500: '#D4AF37', // Primary gold
          600: '#B8960F',
          700: '#8B7500',
          800: '#5C4D00',
          900: '#2E2600',
        },
        burgundy: {
          50: '#FCE8EC',
          100: '#F8D0D9',
          200: '#F1A1B3',
          300: '#EA728D',
          400: '#E34367',
          500: '#722F37', // Primary burgundy
          600: '#5B262C',
          700: '#441D21',
          800: '#2D1316',
          900: '#160A0B',
        },
        cream: {
          50: '#FFFDFB',
          100: '#FFF9F5',
          200: '#FFF5ED',
          300: '#FAEBD7', // Primary cream
          400: '#F5DFC4',
          500: '#E8D0B3',
          600: '#D4B896',
          700: '#B89B78',
          800: '#9A7D5C',
          900: '#7D6041',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
        display: ['var(--font-cormorant)', 'serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-gold': 'linear-gradient(135deg, #D4AF37 0%, #B8960F 50%, #8B7500 100%)',
        'gradient-luxury': 'linear-gradient(180deg, #FAEBD7 0%, #FFF9F5 50%, #FFFFFF 100%)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'gold': '0 4px 14px 0 rgba(212, 175, 55, 0.25)',
        'luxury': '0 10px 40px -10px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-gold': 'pulse-gold 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-gold': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.7' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
