const autoprefixer = require("autoprefixer");
const purgecss = require("@fullhuman/postcss-purgecss");

module.exports = {
  plugins: [
    autoprefixer({
        add: true,
        grid: true
    }),
    //Only add purgecss in production
    process.env.NODE_ENV === "production"? purgecss({
        content: [
            "./src/**/*.html",
            "./src/**/*.vue"
        ]
    }): ""
  ]
}
