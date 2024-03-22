<!DOCTYPE html>
<!-- Copyright (c) Pyro Inc. and parent collaborators -->
<!-- SPDX-License-Identifier: BUSL-1.1 -->
<html data-pyro-html lang="en" style="background-color: #000000; height: 100%; width: 100%; margin: 0; padding: 0;">

  <head>
    @section('meta')
      <meta charset="utf-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport">
      <meta name="robots" content="noindex">
      <link rel="icon" type="image/png" href="/favicons/favicon-180x180.png">
      <meta name="theme-color" content="#000000">
    @show
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap')
    </style>
    @vite('resources/css/app.css')
  </head>

  <body data-pyro-body style="background-color: #000000; height: 100%; width: 100%; margin: 0; padding: 0;">
    <div class='font-jakarta text-white w-full h-full min-h-fit flex gap-12 items-center p-8 max-w-3xl mx-auto'>
      <div class='flex flex-col gap-4 max-w-sm text-left'>
        <div class='flex items-start h-12 w-fit mb-4'>
          <img
              class='w-full max-w-full h-full'
              loading='lazy'
              decoding='async'
              alt=''
              aria-hidden
              src='https://i.imgur.com/Hbum4fc.png'
          />
        </div>
        <h1 class='text-[32px] font-extrabold leading-[98%] tracking-[-0.11rem]'>404: Page Not Found</h1>
        <p class=''>
          We couldn't find the page you're looking for. You may have lost access, or the page may have
          been removed. Here are some helpful links instead:
        </p>
        <div class='flex flex-col gap-2'>
          <a href='/' class='text-brand'>
            Your Servers
          </a>
          <a class='text-brand' href='https://status.pyro.host' rel='noreferrer noopener' target='_blank'>
            Status Page
          </a>
          <a class='flex text-brand fill-brand w-fit items-center gap-2' rel='noopener noreferrer' target='_blank' href='https://discord.gg/fxeRFRbhQh'>
            <svg viewBox='0 0 16 16' aria-hidden='true' class='h-4 w-4'>
              <path fill='currentColor' d='M13.538 2.997A13.092 13.092 0 0 0 10.285 2a.07.07 0 0 0-.054.023c-.137.247-.297.57-.404.817a12.456 12.456 0 0 0-3.657 0 7.468 7.468 0 0 0-.411-.817C5.75 2.008 5.729 2 5.705 2a13.192 13.192 0 0 0-3.253.997c-.008 0-.015.008-.023.015C.357 6.064-.215 9.033.067 11.972c0 .015.008.03.023.038 1.371.99 2.69 1.59 3.993 1.987.022.007.045 0 .053-.015.305-.412.579-.847.815-1.305.015-.03 0-.06-.03-.067a9.446 9.446 0 0 1-1.25-.585c-.03-.015-.03-.06-.008-.083.084-.06.168-.127.252-.187a.048.048 0 0 1 .053-.008c2.621 1.178 5.448 1.178 8.039 0a.048.048 0 0 1 .053.008c.084.067.167.127.251.195.03.022.03.067-.007.082-.396.233-.816.42-1.25.585-.03.008-.038.045-.03.068.244.457.518.892.815 1.304.023.008.046.015.069.008a13.266 13.266 0 0 0 4-1.987.041.041 0 0 0 .023-.038c.335-3.396-.557-6.343-2.362-8.96-.008-.007-.016-.015-.031-.015Zm-8.19 7.183c-.785 0-1.44-.712-1.44-1.59 0-.876.64-1.589 1.44-1.589.807 0 1.447.72 1.44 1.59 0 .877-.64 1.59-1.44 1.59Zm5.31 0c-.785 0-1.44-.712-1.44-1.59 0-.876.64-1.589 1.44-1.589.808 0 1.448.72 1.44 1.59 0 .877-.632 1.59-1.44 1.59Z'></path>
            </svg>
            pyro.host Discord
          </a>
        </div>
      </div>
      <img alt='' class='w-64 rounded-2xl' height='256' src='https://media.tenor.com/scX-kVPwUn8AAAAC/this-is-fine.gif' width='256' loading='lazy' decoding='async' />
    </div>
  </body>
</html>