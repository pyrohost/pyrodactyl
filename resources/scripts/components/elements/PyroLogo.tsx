// million-ignore
const Logo = ({ className, uniqueId }: { className?: string; uniqueId?: string } = {}) => {
    const gradientId = uniqueId
        ? `paint0_radial_${uniqueId}`
        : `paint0_radial_${Math.random().toString(36).substr(2, 9)}`;

    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-labelledby="title desc">
            <style>
                text {
                fill: white;
                font-family: "Inter", "Helvetica Neue", Arial, sans-serif;
                font-weight: 700;
                font-size: 120px;
                letter-spacing: -2px;
                }
            </style>

            <!-- Fondo transparente (mantener para compatibilidad) -->
            <rect width="100%" height="100%" fill="none"/>

            <!-- Texto centrado -->
            <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">Zelora</text>
        </svg>

    );
};

export default Logo;
