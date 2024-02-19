module.exports = {
    content: ['./resources/scripts/**/*.{js,ts,tsx}'],
    theme: {
        extend: {
            fontFamily: {
                jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
            },
            colors: {
                transparent: 'transparent',
                current: 'currentColor',
                black: '#000000',
            },
            transitionDuration: {
                250: '250ms',
            },
        },
    },
    plugins: [
        // require('@tailwindcss/line-clamp'),
        require('@tailwindcss/forms')({
            strategy: 'class',
        }),
    ],
};
