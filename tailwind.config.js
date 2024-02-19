const colors = require('tailwindcss/colors');

// I'm literally so smart :3
delete colors['lightBlue'];
delete colors['warmGray'];
delete colors['trueGray'];
delete colors['coolGray'];
delete colors['blueGray'];

module.exports = {
    content: ['./resources/scripts/**/*.{js,ts,tsx}'],
    theme: {
        extend: {
            fontFamily: {
                jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
            },
            colors: {
                ...colors,
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
