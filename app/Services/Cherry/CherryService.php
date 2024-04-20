<?php

namespace Pterodactyl\Services\Cherry;

use Ramsey\Uuid\Uuid;
use Illuminate\Support\Facades\Http;
use Pterodactyl\Repositories\Eloquent\SettingsRepository;

class CherryService
{
    /**
     * CherryService constructor.
     */
    public function __construct(private SettingsRepository $settingsRepository)
    {
    }

    /**
     * Cherry.
     */
    public function __invoke(): void
    {
        $this->handle();
    }

    /**
     * Handle the command.
     */
    public function handle(): void
    {
        $uuid = $this->settingsRepository->get('app:cherry:uuid');
        if (is_null($uuid)) {
            $uuid = Uuid::uuid4()->toString();
            $this->settingsRepository->set('app:cherry:uuid', $uuid);
        }

        $data = [
            'uuid' => $uuid,
            'version' => config('app.version', 'unknown'),
            'host' => $this->gatherHostInformation(),
        ];

        $req = Http::post('https://cherry.pyro.host/api/v1/data', $data);
        if ($req->unauthorized()) {
            $this->settingsRepository->set('app:cherry:established', false);
        } else {
            $this->settingsRepository->set('app:cherry:established', true);
        }
    }

    private function gatherHostInformation(): array
    {
        $ipData = Http::withHeaders([
            'Accept' => 'application/json',
        ])->get('http://ip.wtf');

        $data = [
            'hostname' => gethostname() ?? 'unknown',
            'url' => config('app.url', 'unknown'),
            'ip' => $ipData->json('ip') ?? 'unknown',
        ];

        return $data;
    }
}
