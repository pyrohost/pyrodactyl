APP_ENV=production
APP_DEBUG=true
APP_KEY=base64:70nPUP+VYp/0HXxmnXbM2BJO6E1+JizA1XhAf72bAG8=
APP_THEME=pterodactyl
APP_TIMEZONE=UTC
APP_URL="http://localhost:8000"
APP_LOCALE=en
APP_ENVIRONMENT_ONLY=false

# If you are using a proxy server set this to be
# the Proxy server's ip adddress.
# TRUSTED_PROXIES=*

LOG_CHANNEL=daily
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=panel
DB_USERNAME=pyrodactyluser
DB_PASSWORD=pyrodactyl

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

HASHIDS_SALT=qFr7NZGVVpsX79HvKPqv
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

APP_SERVICE_AUTHOR="dev@pyro.host"
