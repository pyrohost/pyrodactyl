module.exports = {
    plugins: [
        require('postcss-import'),
        require('@tailwindcss/postcss'),
        require('autoprefixer'),
        // Breaks Tailwind V4?
        // require('postcss-preset-env')({
        //     features: {
        //         'nesting-rules': false,
        //     },
        // }),
    ],
};
