// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors
        'payne-magenta': '#D91E78',
        'payne-cyan': '#40C9C9',
        'payne-mint': '#A8E6CF',
        'payne-light-mint': '#C8F2E0',
        'payne-navy': '#1E293B',
        'payne-dark-navy': '#0F172A',
        'payne-dark-gray': '#334155',
        'payne-white': '#FFFFFF',
        'payne-light-bg': '#F8FAFC',
        navy: {
          900: '#0F172A', // Updated to match payne-dark-navy
          800: '#1E293B', // Updated to match payne-navy
          700: '#334155', // Updated to match payne-dark-gray
        },
        magenta: {
          500: '#D91E78', // Updated to exact payne-magenta
          600: '#C2185B',
        },
        cyan: {
          500: '#40C9C9', // Updated to exact payne-cyan
          600: '#0097A7',
        },
        mint: {
          500: '#A8E6CF', // Updated to exact payne-mint
          600: '#81C784',
          300: '#C8F2E0', // payne-light-mint
        },
        surface: '#FFFFFF',
        'text-light': '#F5F5F5',
        'text-dark': '#0F172A',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #D91E78 0%, #40C9C9 100%)',
        'gradient-alt': 'linear-gradient(to right, #D91E78, #9B4D96, #40C9C9)',
        'gradient-card': 'linear-gradient(145deg, rgba(217, 30, 120, 0.1), rgba(64, 201, 201, 0.1))',
      },
      boxShadow: {
        'glow-magenta': '0 0 20px rgba(217, 30, 120, 0.5)',
        'glow-cyan': '0 0 20px rgba(64, 201, 201, 0.5)',
        'glow-gradient': '0 0 20px rgba(217, 30, 120, 0.3), 0 0 40px rgba(64, 201, 201, 0.3)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in': 'fadeIn 0.8s ease-out',
        'slide-in-left': 'slideInLeft 0.6s ease-out',
        'bounce-subtle': 'bounceSubtle 1s infinite',
        'gradient-shift': 'gradientShift 3s ease infinite',
        'border-rotate': 'borderRotate 5s linear infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        borderRotate: {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '400% 0%' },
        },
      },
    },
  },
  plugins: [],
};
export default config;