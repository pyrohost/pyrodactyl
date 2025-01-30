<!DOCTYPE html>
<!-- Copyright, Nadhi.dev 2024-present -->
<!--
  _   _           _ _     _      _            
 | \ | |         | | |   (_)    | |           
 |  \| | __ _  __| | |__  _   __| | _____   __
 | . ` |/ _` |/ _` | '_ \| | / _` |/ _ \ \ / /
 | |\  | (_| | (_| | | | | || (_| |  __/\ V / 
 |_| \_|\__,_|\__,_|_| |_|_(_)__,_|\___| \_/  
-->
<!-- All pastels instances are powered by Pyrodactyl  -->
 <!-- Images by undraw, storyset. Icons by React icons and LucideReact  -->
 <!--<a href="https://storyset.com/work">Work illustrations by Storyset</a>-->
 

    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <!-- SSR Objects -->

        <title inertia>{{ config('app.name', 'Laravel') }}</title>
        <link rel="icon" href="{{ config('app.company_logo_url') }}" type="image/svg+xml">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?fam
        ily=figtree:400,500,600&display=swap" rel="stylesheet" />
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Kanit:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
        
        <!-- Fonts -->
<link rel="preconnect" href="https://fonts.bunny.net">
<link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Doto:wght@100..900&display=swap" rel="stylesheet">

        <!-- Scripts -->
        
        @viteReactRefresh
        @vite(['resources/scripts/components/App.tsx', "resources/scripts/components/Pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        <!-- React frontend -->
        @inertia
    </body>
</html>