/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'display': ['Space Grotesk', 'system-ui', 'sans-serif'],
        'reading': ['Instrument Serif', 'Georgia', 'serif'],
        'mono': ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        ios: {
          blue: '#007AFF',
          'blue-dark': '#0A84FF',
          gray: {
            50: '#F9FAFB',
            100: '#F2F2F7',
            200: '#E5E5EA',
            300: '#D1D1D6',
            400: '#C7C7CC',
            500: '#8E8E93',
            600: '#636366',
            700: '#48484A',
            800: '#3A3A3C',
            900: '#1C1C1E',
          },
          green: '#34C759',
          orange: '#FF9500',
          red: '#FF3B30',
          purple: '#AF52DE',
        }
      },
      borderRadius: {
        'ios': '12px',
        'ios-lg': '16px',
        'ios-xl': '20px',
      },
      boxShadow: {
        'ios': '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)',
        'ios-lg': '0 2px 8px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.12)',
        'ios-float': '0 4px 16px rgba(0,0,0,0.12), 0 12px 40px rgba(0,0,0,0.08)',
      },
      animation: {
        'ios-bounce': 'iosBounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'ios-fade-in': 'iosFadeIn 0.3s ease-out',
        'ios-slide-up': 'iosSlideUp 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'shimmer': 'shimmer 2s infinite linear',
      },
      keyframes: {
        iosBounce: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        iosFadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        iosSlideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      },
      backdropBlur: {
        'ios': '20px',
      }
    },
  },
  plugins: [],
}
