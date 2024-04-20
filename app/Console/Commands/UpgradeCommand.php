<?php

namespace Pterodactyl\Console\Commands;

use Illuminate\Console\Command;

class UpgradeCommand extends Command
{
    protected const GITHUB_URL = 'https://github.com/pyrohost/panel/';

    protected $signature = 'p:upgrade
        {--user= : The user that PHP runs under. All files will be owned by this user.}
        {--group= : The group that PHP runs under. All files will be owned by this group.}';

    protected $description = 'Clone the latest version of the Panel from the repository and run the upgrade process.';

    public function handle()
    {
        $this->error('This command is currently disabled.');
        return;
    }
}
