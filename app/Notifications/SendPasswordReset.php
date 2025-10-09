<?php

namespace Pterodactyl\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

class SendPasswordReset extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public string $token)
    {
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
    public function toMail(mixed $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject('Restablece tu contraseña')
            ->line('Hemos recibido una petición de restablecimiento de contraseña para tu cuenta.')
            ->action('Restablecer contraseña', url('/auth/password/reset/' . $this->token . '?email=' . urlencode($notifiable->email)))
            ->line('Si no has pedido un cambio de contraseña, no hace falta que cliques en el enlace.');
    }
}
