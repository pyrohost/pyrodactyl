<?php

namespace Pterodactyl\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

class AddedToServer extends Notification implements ShouldQueue
{
    use Queueable;

    public object $server;

    /**
     * Create a new notification instance.
     */
    public function __construct(array $server)
    {
        $this->server = (object) $server;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(): MailMessage
    {
        return (new MailMessage())
            ->greeting('Hola ' . $this->server->user . ',')
            ->line('Has recibido acceso al panel de un servidor. Esto te abre la posibilidad de gestionarlo desde nuestra página:')
            ->line('Nombre del servidor: ' . $this->server->name)
            ->action('Visitar', url('/server/' . $this->server->uuidShort));
    }
}
