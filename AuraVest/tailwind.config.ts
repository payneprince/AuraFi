import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        },
        // AuraVest Brand Colors - Black, White & Red Theme
        crimson: {
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
        },
        scarlet: {
          500: '#FF0000',
          600: '#CC0000',
        },
        slate: {
          900: '#0F172A',
          950: '#020617',
        },
        white: '#FFFFFF',
        black: '#000000',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #000000 0%, #DC2626 50%, #EF4444 100%)',
        'gradient-crimson': 'linear-gradient(135deg, #B91C1C 0%, #DC2626 50%, #F87171 100%)',
        'gradient-red-dark': 'linear-gradient(135deg, #000000 0%, #7F1D1D 50%, #DC2626 100%)',
        'gradient-red-light': 'linear-gradient(135deg, #DC2626 0%, #EF4444 50%, #FFFFFF 100%)',
        'gradient-card': 'linear-gradient(145deg, rgba(0, 0, 0, 0.8) 0%, rgba(220, 38, 38, 0.2) 50%, rgba(239, 68, 68, 0.1) 100%)',
      },
      boxShadow: {
        'glow-red': '0 0 30px rgba(239, 68, 68, 0.6), 0 0 60px rgba(220, 38, 38, 0.3)',
        'glow-crimson': '0 0 40px rgba(220, 38, 38, 0.7), 0 0 80px rgba(185, 28, 28, 0.4)',
        'glow-gradient': '0 0 50px rgba(239, 68, 68, 0.5), 0 0 100px rgba(220, 38, 38, 0.3), 0 0 150px rgba(0, 0, 0, 0.2)',
      },
      container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',
        '2xl': '6rem',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
      },
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
