<!DOCTYPE html>
<!-- Astraltactly is a Performance and Looks based Edit by Nadhi.dev
_____            __                .__
  /  _  \   _______/  |_____________  |  |
 /  /_\  \ /  ___/\   __\_  __ \__  \ |  |
/    |    \\___ \  |  |  |  | \// __ \|  |__
\____|__  /____  > |__|  |__|  (____  /____/
        \/     \/                   \/

Please thank Pyrodactyl for this -->
<html data-pyro-html lang="en" style="background-color: #000000; height: 100%; width: 100%; margin: 0; padding: 0;">
    <head>
        <title>{{ config('app.name', 'Panel') }}</title>

        @section('meta')
            <meta charset="utf-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport">
            <meta name="csrf-token" content="{{ csrf_token() }}">
            <meta name="robots" content="noindex">
            <link rel="icon" type="image/png" href="/favicons/favicon-180x180.png">
            <meta name="theme-color" content="#000000">
        @show

        @section('user-data')
            @if(!is_null(Auth::user()))
                <script>
                    window.PterodactylUser = {!! json_encode(Auth::user()->toVueObject()) !!};
                </script>
            @endif
            @if(!empty($siteConfiguration))
                <script>
                    window.SiteConfiguration = {!! json_encode($siteConfiguration) !!};
                </script>
            @endif
        @show
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap')
            .snowflake {
        position: fixed;
        color: #F0F8FF; /* Changed to Alice Blue */
        opacity: 0.7;
        pointer-events: none;
        user-select: none;
        z-index: 9999;
        animation: fall linear infinite;
    }   
    @keyframes fall {
                to {
                    transform: translateY(100vh);
                }
            }

            @keyframes sway {
                0%, 100% {
                    transform: translateX(0);
                }
                50% {
                    transform: translateX(30px);
                }
            }
         
        </style>

        @yield('assets')

        @include('layouts.scripts')

        @viteReactRefresh
        @vite('resources/scripts/index.tsx')
    </head>
    <body data-pyro-body class="{{ $css['body'] }}" style="background-color: #000000; height: 100%; width: 100%; margin: 0; padding: 0;">
        @section('content')
            @yield('above-container')
            @yield('container')
            @yield('below-container')
        @show

        <script>
document.addEventListener('DOMContentLoaded', function() {
    function createSnowflake() {
        const snowflake = document.createElement('div');
        snowflake.classList.add('snowflake');
        snowflake.innerHTML = '❄️';
        
        // Randomize position across width
        snowflake.style.left = `${Math.random() * 100}%`;
        
        // Start above the viewport
        snowflake.style.top = '-20px';
        
        // Randomize size
        const size = Math.random() * 10 + 5;
        snowflake.style.fontSize = `${size}px`;
        
        // Randomize fall duration and delay
        const duration = Math.random() * 10 + 10;
        snowflake.style.animationDuration = `${duration}s`;
        snowflake.style.animationDelay = `${Math.random() * 5}s`;

        document.body.appendChild(snowflake);
    }

    // Reduced to a small amount of snowflakes
    for (let i = 0; i < 20; i++) {
        createSnowflake();
    }
});
</script>
    </body>
</html>