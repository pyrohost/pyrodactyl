<?php

namespace Pterodactyl\Console\Commands;

use Illuminate\Console\Command;
use Pterodactyl\Services\Cherry\CherryService;

class CherryCommand extends Command
{
    /**
     * The console command name.
     */
    protected $signature = 'p:cherry';
    protected $description = 'Cherry';

    /**
     * CherryCommand constructor.
     */
    public function __construct(private CherryService $cherryService)
    {
        parent::__construct();
    }

    /**
     * Handle the command.
     */
    public function handle()
    {
        $this->cherryService->handle();
    }
}
