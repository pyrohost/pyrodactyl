import { useState, useEffect } from 'react';

export function useVW() {
    const [vw, setVW] = useState(window.innerWidth);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        function handleResize() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setVW(window.innerWidth);
            }, 100);
        }

        window.addEventListener('resize', handleResize);

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return vw;
}
