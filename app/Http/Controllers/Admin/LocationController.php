<?php

namespace Pterodactyl\Http\Controllers\Admin;

use Illuminate\View\View;
use Inertia\Inertia;
use Inertia\Response;
use Pterodactyl\Models\Location;
use Pterodactyl\Models\Plan;
use Illuminate\Http\RedirectResponse;
use Prologue\Alerts\AlertsMessageBag;
use Illuminate\View\Factory as ViewFactory;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Http\Requests\Admin\LocationFormRequest;
use Pterodactyl\Services\Locations\LocationUpdateService;
use Pterodactyl\Services\Locations\LocationCreationService;
use Pterodactyl\Services\Locations\LocationDeletionService;
use Pterodactyl\Contracts\Repository\LocationRepositoryInterface;
use Illuminate\Support\Facades\Log;

class LocationController extends Controller
{
    /**
     * LocationController constructor.
     */
    public function __construct(
        protected AlertsMessageBag $alert,
        protected LocationCreationService $creationService,
        protected LocationDeletionService $deletionService,
        protected LocationRepositoryInterface $repository,
        protected LocationUpdateService $updateService,
        protected ViewFactory $view
    ) {
    }

    /**
     * Return the location overview page.
     */
    public function index(): View
    {

        $plans = Plan::select(['id', 'name', 'memory', 'cpu'])
            ->orderBy('memory')
            ->get();


        return $this->view->make('admin.locations.index', [
            'locations' => $this->repository->getAllWithDetails(),
            'plans' => $plans,
        ]);
    }

    /**
     * Return the location view page.
     *
     * @throws \Pterodactyl\Exceptions\Repository\RecordNotFoundException
     */
    public function view(int $id): Response
{
    $location = $this->repository->getWithNodes($id);
    $plans = Plan::select(['id', 'name', 'memory', 'cpu'])
            ->orderBy('memory')
            ->get();
    
    return Inertia::render('Admin/Locations/loc.view', [
        'location' => [
            'id' => $location->id,
            'short' => $location->short,
            'long' => $location->long,
            'flag_url' => $location->flag_url,
            
            'maximum_servers' => $location->maximum_servers,
            'required_plans' => $location->required_plans,
            'required_rank' => $location->required_rank,
            'nodes' => $location->nodes->map(fn($node) => [
                'id' => $node->id,
                'name' => $node->name,
                'fqdn' => $node->fqdn,
                'servers_count' => $node->servers->count()
            ])
            ],
        'plans' => $plans,
    ]);
}

    /**
     * Handle request to create new location.
     *
     * @throws \Throwable
     */
    public function create(LocationFormRequest $request): RedirectResponse
{
    try {
        \Log::info('Location create request data:', $request->all());
        \Log::info('Normalized data:', $request->normalize());
        
        $location = $this->creationService->handle($request->normalize());
        
        \Log::info('Location created:', ['id' => $location->id]);
        $this->alert->success('Location was created successfully.')->flash();

        return redirect()->route('admin.locations.view', $location->id);
    } catch (DisplayException $ex) {
        \Log::error('Location creation failed:', ['error' => $ex->getMessage()]);
        $this->alert->danger($ex->getMessage())->flash();
        return redirect()->route('admin.locations')->withInput();
    } catch (\Exception $ex) {
        \Log::error('Unexpected error:', ['error' => $ex->getMessage()]);
        $this->alert->danger('An unexpected error occurred.')->flash();
        return redirect()->route('admin.locations')->withInput();
    }
}

    /**
     * Handle request to update or delete location.
     *
     * @throws \Throwable
     */
    public function update(LocationFormRequest $request, Location $location): RedirectResponse
{
    try {
        if ($request->input('action') === 'delete') {
            return $this->delete($location);
        }

        $data = $request->normalize();
        
        // Ensure required_rank is array
        if (isset($data['required_rank']) && !is_array($data['required_rank'])) {
            $data['required_rank'] = [$data['required_rank']];
        }

        $this->updateService->handle($location->id, $data);
        
        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Location updated successfully',
                'location' => $location->fresh()
            ]);
        }

        $this->alert->success('Location updated successfully.')->flash();
        return redirect()->back();

    } catch (DisplayException $ex) {
        if ($request->wantsJson()) {
            return response()->json([
                'success' => false,
                'message' => $ex->getMessage()
            ], 400);
        }

        $this->alert->danger($ex->getMessage())->flash();
        return redirect()->back()->withInput();
    }
}

    /**
     * Delete a location from the system.
     *
     * @throws \Exception
     * @throws \Pterodactyl\Exceptions\DisplayException
     */
    public function delete(Location $location): RedirectResponse
    {
        try {
            $this->deletionService->handle($location->id);

            return redirect()->route('admin.locations');
        } catch (DisplayException $ex) {
            $this->alert->danger($ex->getMessage())->flash();
        }

        return redirect()->route('admin.locations.view', $location->id);
    }
}
