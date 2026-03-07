module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // Minify CSS in production builds to reduce bundle size
    ...(process.env.NODE_ENV === 'production' ? { cssnano: { preset: 'default' } } : {}),
  },
}