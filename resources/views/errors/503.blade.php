    <!DOCTYPE html>
    <html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Under Maintenance</title>
        <style>
            :root {
                --bg-light: #ffffff;
                --bg-dark: #18181b;
                --text-light: #27272a;
                --text-dark: #fafafa;
                --zinc-200: #e4e4e7;
                --zinc-300: #d4d4d8;
                --zinc-700: #3f3f46;
                --zinc-800: #27272a;
                --blue-500: #3b82f6;
                --blue-600: #2563eb;
            }
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                background-color: var(--bg-light);
                color: var(--text-light);
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 1rem;
                transition: background-color 0.3s, color 0.3s;
            }
            .dark {
                background-color: var(--bg-dark);
                color: var(--text-dark);
            }
            .container {
                max-width: 32rem;
                text-align: center;
            }
            .icon {
                width: 120px;
                height: 120px;
                margin-bottom: 2rem;
            }
            h1 {
                font-size: 2.25rem;
                font-weight: bold;
                margin-bottom: 1rem;
            }
            p {
                font-size: 1.125rem;
                color: var(--zinc-700);
                margin-bottom: 2rem;
            }
            .dark p {
                color: var(--zinc-300);
            }
            .buttons {
                display: flex;
                justify-content: center;
                gap: 1rem;
            }
            .button {
                padding: 0.75rem 1.5rem;
                border-radius: 0.375rem;
                font-weight: 500;
                text-decoration: none;
                transition: background-color 0.3s;
            }
            .button-primary {
                background-color: var(--blue-500);
                color: white;
            }
            .button-primary:hover {
                background-color: var(--blue-600);
            }
            .button-secondary {
                background-color: var(--zinc-200);
                color: var(--text-light);
            }
            .button-secondary:hover {
                background-color: var(--zinc-300);
            }
            .dark .button-secondary {
                background-color: var(--zinc-800);
                color: var(--text-dark);
            }
            .dark .button-secondary:hover {
                background-color: var(--zinc-700);
            }
            footer {
                margin-top: 4rem;
                font-size: 0.875rem;
                color: var(--zinc-700);
            }
            .dark footer {
                color: var(--zinc-300);
            }
            #theme-toggle {
                position: fixed;
                bottom: 1rem;
                right: 1rem;
                padding: 0.75rem;
                background-color: var(--zinc-200);
                border: none;
                border-radius: 9999px;
                cursor: pointer;
                transition: background-color 0.3s;
            }
            .dark #theme-toggle {
                background-color: var(--zinc-800);
            }
            #theme-toggle:hover {
                background-color: var(--zinc-300);
            }
            .dark #theme-toggle:hover {
                background-color: var(--zinc-700);
            }
            .icon-moon, .icon-sun {
                width: 1.25rem;
                height: 1.25rem;
                fill: none;
                stroke: currentColor;
                stroke-width: 2;
                stroke-linecap: round;
                stroke-linejoin: round;
            }
            .dark .icon-sun {
                display: block;
            }
            .dark .icon-moon {
                display: none;
            }
            .icon-sun {
                display: none;
            }
            .icon-moon {
                display: block;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <img src="{{ asset('assets/svgs/503.svg') }}" class="icon" alt="Maintenance Icon">    <h1>Oops! We aren't available right now</h1>
            <p>We're currently updating our systems to bring you an even better experience. Thank you for your patience.</p>
            <div class="buttons">
                <button onclick="window.location.reload()" class="button button-primary">Refresh Page</button>
                
            </div>
        </div>
        <footer>
            <p>&copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
        </footer>
        <button id="theme-toggle" aria-label="Toggle theme">
            <svg class="icon-moon" viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
            <svg class="icon-sun" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
        </button>
        <script>
            const themeToggle = document.getElementById('theme-toggle');
            const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

            function setTheme(theme) {
                document.body.classList.toggle('dark', theme === 'dark');
                localStorage.setItem('theme', theme);
            }

            function getTheme() {
                return localStorage.getItem('theme') || (prefersDarkScheme.matches ? 'dark' : 'light');
            }

            setTheme(getTheme());

            themeToggle.addEventListener('click', () => {
                const currentTheme = getTheme();
                setTheme(currentTheme === 'dark' ? 'light' : 'dark');
            });

            prefersDarkScheme.addEventListener('change', (e) => {
                setTheme(e.matches ? 'dark' : 'light');
            });
        </script>
    </body>
    </html>