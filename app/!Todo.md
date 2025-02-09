Add inerstia to Login Controller //fixed
Add Ziggy JS //later
Fix the password controller //fixed


2025

Simple CDN for images and etc

Ability to change the code used in server list and etc (Coustamizablity) for different looks

Ability to change layout

Ability to change Colors on certain pages 

Ability to show and not show SHOP

Server Creator

default dark mode 



⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️
Server creation, It needs to check for plan count and compare if there are avliable plans or not!
⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️



Fix backups and databases (done)


////////////////////////////////
*
* Important ones 
*


>> plan by plan upgrade for servers
>> Upgrade servers 
>> Add boost button for servers





# Use this Alert Dialog 

<AlertDialog open={showError}  onOpenChange={setShowError}>
        <AlertDialogContent className="max-w-[425px]">
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20">
                <LucideAlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <AlertDialogTitle className="text-xl font-semibold">Error during transaction</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-4 text-base">{flash.error}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


# Sucess version of this


<AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
      <AlertDialogContent className="max-w-[425px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
              <LucideCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <AlertDialogTitle className="text-xl font-semibold">
              {flash?.success?.title || 'Success'}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-4 text-base">
            {flash?.success?.desc || 'Operation completed successfully'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-lg">Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>






curl "https://127.0.0.1:8000/api/application/users" \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer ptla_RG6XnTHYOYaMEpULTym7M90KPrjT0wVVeaCdzf7fOOF' \
  -X GET 
  







APP_ENV=production
APP_DEBUG=true
APP_KEY=base64:2IY74O6Vd/vG3uysnIVf27FaKXTlrgga0T/5p1T4knI=
APP_THEME=nothing
APP_NAME=Pastel
VERSION=1.0.0
APP_TIMEZONE=UTC
APP_URL="https://panel.nadhi.dev"
APP_LOCALE=en
APP_ENVIRONMENT_ONLY=false

# Using tailwind Color patterns default - bg-gradient-to-r from-zinc-400 to-stone-300 dark:from-pink-500 dark:to-zinc-800

BANNER_CLR="bg-pink-300"

SVR_LIST_TSX="" 
# Later adding customizabilty to how the servers must be rendered.

# If you are using a proxy server set this to be
# the Proxy server's ip adddress.
# TRUSTED_PROXIES=*

LOG_CHANNEL=daily
LOG_LEVEL=debug

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=panel
DB_USERNAME=pterodactyl
DB_PASSWORD=Lapizcumpo123

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

CACHE_DRIVER=file
QUEUE_CONNECTION=database
SESSION_DRIVER=database

HASHIDS_SALT=VClPgM8JSEv8WwCEJ1FI
HASHIDS_LENGTH=8

MAIL_MAILER=smtp
MAIL_HOST=smtp.example.com
MAIL_PORT=25
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=no-reply@example.com
MAIL_FROM_NAME="Pterodactyl Panel"
# You should set this to your domain to prevent it defaulting to 'localhost', causing
# mail servers such as Gmail to reject your mail.
#
# @see: https://github.com/pterodactyl/panel/pull/3110
# MAIL_EHLO_DOMAIN=panel.example.com

APP_SERVICE_AUTHOR="unknown@unknown.com"
SESSION_SECURE_COOKIE=true
RECAPTCHA=false


#  $$$$$$\             $$\     $$\     $$\
# $$  __$$\            $$ |    $$ |    \__|
# $$ /  \__| $$$$$$\ $$$$$$\ $$$$$$\   $$\ $$$$$$$\   $$$$$$\   $$$$$$$\
# \$$$$$$\  $$  __$$\\_$$  _|\_$$  _|  $$ |$$  __$$\ $$  __$$\ $$  _____|
#  \____$$\ $$$$$$$$ | $$ |    $$ |    $$ |$$ |  $$ |$$ /  $$ |\$$$$$$\
# $$\   $$ |$$   ____| $$ |$$\ $$ |$$\ $$ |$$ |  $$ |$$ |  $$ | \____$$\
# \$$$$$$  |\$$$$$$$\  \$$$$  |\$$$$  |$$ |$$ |  $$ |\$$$$$$$ |$$$$$$$  |
#  \______/  \_______|  \____/  \____/ \__|\__|  \__| \____$$ |\_______/
#                                                    $$\   $$ |
#                                                    \$$$$$$  |
#                                                     \______/  Made by Kushi :(



VITE_LOGO_URL="https://i.ibb.co/cCM1XT8/Untitled-design.png"
# This could either be /<public asset png> or an link, highly recommend making some random CDN and making it a link tho :D. Cuz im not very good at cooding
VITE_SITE_NAME=Nadhi.dev
# Logo Name will be registered here please don't enter it like this VITE_SITE_NAME="My Site name" but rather like VITE_SITE_NAME=My site name
VITE_STATUS_PAGE=
# This part was requested by Nate, Please remember his discord ID - 358720980669038592
# It changes the status page title, don't make it some sus BS please
VITE_STATUS_PAGE_TITLE_NATE=
VITE_APP_NAME=Pastel

