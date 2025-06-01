<!DOCTYPE html>
<!--
  _   _           _ _     _      _            
 | \ | |         | | |   (_)    | |           
 |  \| | __ _  __| | |__  _   __| | _____   __
 | . ` |/ _` |/ _` | '_ \| | / _` |/ _ \ \ / /
 | |\  | (_| | (_| | | | | || (_| |  __/\ V / 
 |_| \_|\__,_|\__,_|_| |_|_(_)__,_|\___| \_/  
-->
<!-- Copyright, Nadhi.dev -->
<!-- Beta Rydactyl. Powered by Bun.sh  -->
<!-- Icon library https://icons.pqoqubbw.dev/  -->
<!-- This file is part of the Rydactyl project, which is released under the GNU General Public License v3.0. -->
<!-- ryx.us , Who told hosting should be expensive. -->

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
    </body>
</html>
