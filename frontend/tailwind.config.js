// Warna memakai channel RGB (--xxx-rgb) supaya modifier opacity Tailwind bekerja,
// mis. bg-cyber-danger/15. Nilainya didefinisikan di src/index.css (terang & gelap).
const c = (name) => `rgb(var(--${name}-rgb) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: c('bg'),
          panel: c('panel'),
          border: c('border'),
          text: c('text'),
          muted: c('muted'),
          accent: c('accent'),
          danger: c('danger'),
          warn: c('warn'),
          safe: c('safe'),
        },
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
