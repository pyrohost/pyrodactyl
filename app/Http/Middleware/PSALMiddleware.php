<?php

/*
    WARNING: This file is protected by the PSAL license and is critical for the
    operation of this software. Modifying this file without permission is
    strictly prohibited and will result in the violation of our license agreement.
    Unauthorized modifications can lead to severe consequences, including
    the corruption of your installation and potential legal action.
*/

namespace Pterodactyl\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Contracts\Routing\ResponseFactory;
use Pterodactyl\Repositories\Eloquent\SettingsRepository;

class PSALMiddleware
{
    public function __construct(private ResponseFactory $cgitytgf0, private SettingsRepository $fueeymnf1)
    {
    }

    public function handle(Request $otzfloxc2, \Closure $klashcdw3)
    {
        if (!$this->fueeymnf1->get(base64_decode('YXBwOmNoZXJyeTplc3RhYmxpc2hlZA=='))) {
            return $this->cgitytgf0->json([
                base64_decode('ZXJyb3I=') => base64_decode('RmFpbGVkIHRvIGVzdGFibGlzaCBhIGNvbm5lY3Rpb24gd2l0aCB0aGUgQ2hlcnJ5IEFQSSwgY29udGFjdCBzdXBwb3J0IGlmIHRoaXMgaXNzdWUgcGVyc2lzdHMuIChjb2RlLiAxMDc3KQ=='),
            ], 403);
        }

        return $klashcdw3($otzfloxc2);
    }
}
