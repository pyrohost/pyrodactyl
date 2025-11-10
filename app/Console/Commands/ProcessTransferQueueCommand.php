<?php

namespace Pterodactyl\Console\Commands;

use Illuminate\Console\Command;
use Pterodactyl\Services\Servers\TransferQueueService;

class ProcessTransferQueueCommand extends Command
{
    protected $signature = 'p:transfer:process-queue';

    protected $description = 'Process the server transfer queue and activate waiting transfers';

    public function __construct(
        private TransferQueueService $transferQueueService,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $activated = $this->transferQueueService->processQueue();

        if ($activated > 0) {
            $this->info("Activated {$activated} transfer(s) from queue.");
        }

        return 0;
    }
}
