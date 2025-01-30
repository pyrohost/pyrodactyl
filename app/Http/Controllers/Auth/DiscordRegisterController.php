<?php

namespace Pterodactyl\Http\Controllers\Auth;

use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use GuzzleHttp\Client;

class DiscordRegisterController extends Controller
{
    public function redirectToDiscord()
    {
        return Socialite::driver('discord')
            ->scopes(['identify', 'email', 'guilds.join'])
            ->with([
                'guild_id' => env('DISCORD_SERVER_ID'),
                'permissions' => '0',
                'response_type' => 'code',
                'prompt' => 'consent'
            ])
            ->redirect();
    }

    public function handleDiscordCallback()
    {
        try {
            $discordUser = Socialite::driver('discord')->user();
            
            // Add to Discord guild
            $this->addUserToGuild($discordUser);

            // Create or get user
            $user = User::firstOrCreate(
                ['email' => $discordUser->getEmail()],
                [
                    'external_id' => 'discord:'.$discordUser->getId(),
                    'uuid' => Str::uuid()->toString(),
                    'username' => $discordUser->getNickname() ?? 'user_'.Str::random(8),
                    'name_first' => $discordUser->getName() ?? 'Discord',
                    'name_last' => 'User',
                    'password' => Hash::make(Str::random(32)),
                    'language' => 'en',
                    'root_admin' => false
                ]
            );

            Auth::login($user, true);
            return redirect()->intended('/');
            
        } catch (\Exception $e) {
            return redirect()->route('auth.login')->with('error', 'Failed to authenticate with Discord');
        }
    }

    protected function addUserToGuild($discordUser)
    {
        try {
            $client = new Client();
            $response = $client->put("https://discord.com/api/v10/guilds/" . env('DISCORD_SERVER_ID') . "/members/" . $discordUser->getId(), [
                'headers' => [
                    'Authorization' => 'Bot ' . env('DISCORD_BOT_TOKEN'),
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'access_token' => $discordUser->token,
                ]
            ]);
            return true;
        } catch (\Exception $e) {
            \Log::error('Failed to add user to Discord guild: ' . $e->getMessage());
            return false;
        }
    }
}