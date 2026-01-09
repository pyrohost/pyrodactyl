<?php

namespace Pterodactyl\Http\Controllers\Admin\Nodes;

use Illuminate\View\View;
use Illuminate\Http\Request;
use Pterodactyl\Models\Node;
use Spatie\QueryBuilder\QueryBuilder;
use Pterodactyl\Http\Controllers\Controller;
use Illuminate\Contracts\View\Factory as ViewFactory;
use Pterodactyl\Repositories\Eloquent\NodeRepository;
use Illuminate\Support\Facades\Log;

class NodeController extends Controller
{
    /**
     * NodeController constructor.
     */
    public function __construct(private ViewFactory $view) {}

    /**
     * Returns a listing of nodes on the system.
     */
    public function index(Request $request): View
    {
        $nodes = QueryBuilder::for(
            Node::query()->with('location')->withCount('servers')
        )
            ->allowedFilters(['uuid', 'name'])
            ->allowedSorts(['id'])
            ->paginate(25);

        foreach ($nodes as $node) {
            $stats = app('Pterodactyl\Repositories\Eloquent\NodeRepository')->getUsageStatsRaw($node);
            // NOTE: Pre-creating stats so we donn't do it in the blade

            $memoryPercent = ($stats['memory']['value'] / $stats['memory']['base_limit']) * 100;
            $diskPercent = ($stats['disk']['value'] / $stats['disk']['base_limit']) * 100;

            $node->memory_percent = round($memoryPercent);
            $node->memory_color = $memoryPercent < 50 ? '#50af51' : ($memoryPercent < 70 ? '#e0a800' : '#d9534f');
            $node->allocated_memory = humanizeSize($stats['memory']['value'] * 1024 * 1024);
            $node->total_memory = humanizeSize($stats['memory']['max'] * 1024 * 1024);

            $node->disk_percent = round($diskPercent);
            $node->disk_color = $diskPercent < 50 ? '#50af51' : ($diskPercent < 70 ? '#e0a800' : '#d9534f');
            $node->allocated_disk = humanizeSize($stats['disk']['value'] * 1024 * 1024);
            $node->total_disk = humanizeSize($stats['disk']['max'] * 1024 * 1024);
        }


        return $this->view->make('admin.nodes.index', ['nodes' => $nodes]);
    }
}
