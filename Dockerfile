# Stage 0:
# Build the frontend
FROM --platform=$TARGETOS/$TARGETARCH node:lts-alpine AS frontend
WORKDIR /app
COPY . ./
RUN apk add --no-cache --update git \
  && npm install -g turbo  \
  && npm ci  \
  && npm run ship \
  && apk del git

# Stage 1:
# Build the actual container with all of the needed PHP dependencies that will run the application.
FROM --platform=$TARGETOS/$TARGETARCH php:8.3-fpm-alpine
WORKDIR /app
COPY . ./
COPY --from=frontend /app/public/assets ./public/assets
COPY --from=frontend /app/public/build ./public/build

RUN apk add --no-cache --update \
  ca-certificates \
  dcron \
  curl \
  git \
  supervisor \
  tar \
  unzip \
  nginx \
  libpng-dev \
  libxml2-dev \
  libzip-dev \
  postgresql-dev \
  certbot \
  certbot-nginx \
  mysql-client \
  && docker-php-ext-configure zip \
  && docker-php-ext-install bcmath gd pdo pdo_mysql pdo_pgsql zip \
  && curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
  && cp .env.example .env \
  && mkdir -p bootstrap/cache/ storage/logs storage/framework/sessions storage/framework/views storage/framework/cache \
  && chmod -R 777 bootstrap storage \
  && composer install --no-dev --optimize-autoloader \
  && rm -rf .env bootstrap/cache/*.php \
  && mkdir -p /app/storage/logs/ \
  && chown -R nginx:nginx .

RUN rm /usr/local/etc/php-fpm.conf \
  && echo "* * * * * /usr/local/bin/php /app/artisan schedule:run >> /dev/null 2>&1" >> /var/spool/cron/crontabs/root \
  && echo "0 23 * * * certbot renew --nginx --quiet" >> /var/spool/cron/crontabs/root \
  && sed -i s/ssl_session_cache/#ssl_session_cache/g /etc/nginx/nginx.conf \
  && mkdir -p /var/run/php /var/run/nginx

COPY --chown=nginx:nginx .github/docker/default.conf /etc/nginx/http.d/default.conf
COPY --chown=nginx:nginx .github/docker/www.conf /usr/local/etc/php-fpm.conf
COPY --chown=nginx:nginx .github/docker/supervisord.conf   /etc/supervisord.conf

RUN ln -s /bin/ash /bin/bash

EXPOSE 80 443
ENTRYPOINT [ "/bin/ash", ".github/docker/entrypoint.sh" ]
CMD [ "supervisord", "-n", "-c", "/etc/supervisord.conf" ]
