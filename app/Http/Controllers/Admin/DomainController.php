<?php

namespace Pterodactyl\Http\Controllers\Admin;

use Illuminate\View\View;
use Pterodactyl\Models\Domain;
use Illuminate\Http\RedirectResponse;
use Prologue\Alerts\AlertsMessageBag;
use Illuminate\View\Factory as ViewFactory;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Http\Requests\Admin\DomainFormRequest;
use Pterodactyl\Services\Domains\DomainCreationService;
use Pterodactyl\Services\Domains\DomainUpdateService;
use Pterodactyl\Services\Domains\DomainDeletionService;
use Pterodactyl\Services\Dns\DnsManager;
use Illuminate\Http\JsonResponse;

class DomainController extends Controller
{
    public function __construct(
        protected AlertsMessageBag $alert,
        protected DomainCreationService $creationService,
        protected DomainUpdateService $updateService,
        protected DomainDeletionService $deletionService,
        protected DnsManager $dnsManager,
        protected ViewFactory $view,
    ) {
    }

    /**
     * Return the domain overview page.
     */
    public function index(): View
    {
        $domains = Domain::with(['servers'])->get();
        $providers = $this->dnsManager->getAvailableProviders();

        return $this->view->make('admin.domains.index', [
            'domains' => $domains,
            'providers' => $providers,
        ]);
    }

    /**
     * Return the domain view page.
     */
    public function view(Domain $domain): View
    {
        $domain->load(['servers.user', 'servers.node']);
        
        return $this->view->make('admin.domains.view', [
            'domain' => $domain,
            'providers' => $this->dnsManager->getAvailableProviders(),
        ]);
    }

    /**
     * Handle request to create new domain.
     *
     * @throws \Throwable
     */
    public function create(DomainFormRequest $request): RedirectResponse
    {
        try {
            $domain = $this->creationService->handle($request->normalize());
            $this->alert->success('Domain was created successfully.')->flash();

            return redirect()->route('admin.domains.view', $domain->id);
        } catch (DisplayException $ex) {
            $this->alert->danger($ex->getMessage())->flash();
            return redirect()->route('admin.domains');
        }
    }

    /**
     * Handle request to update domain.
     *
     * @throws \Throwable
     */
    public function update(DomainFormRequest $request, Domain $domain): RedirectResponse
    {
        if ($request->input('action') === 'delete') {
            return $this->delete($domain);
        }

        try {
            $this->updateService->handle($domain, $request->normalize());
            $this->alert->success('Domain was updated successfully.')->flash();

            return redirect()->route('admin.domains.view', $domain->id);
        } catch (DisplayException $ex) {
            $this->alert->danger($ex->getMessage())->flash();
            return redirect()->route('admin.domains.view', $domain->id);
        }
    }

    /**
     * Delete a domain from the system.
     *
     * @throws \Exception
     */
    public function delete(Domain $domain): RedirectResponse
    {
        try {
            $this->deletionService->handle($domain);
            $this->alert->success('Domain was deleted successfully.')->flash();

            return redirect()->route('admin.domains');
        } catch (DisplayException $ex) {
            $this->alert->danger($ex->getMessage())->flash();
            return redirect()->route('admin.domains.view', $domain->id);
        }
    }

    /**
     * Test DNS provider connection.
     */
    public function testConnection(Domain $domain): JsonResponse
    {
        try {
            $result = $this->dnsManager->testConnection($domain);
            
            return response()->json([
                'success' => $result,
                'message' => $result ? 'Connection successful' : 'Connection failed'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }


    /**
     * Get provider configuration fields.
     */
    public function getProviderConfig(string $provider): JsonResponse
    {
        try {
            $providers = $this->dnsManager->getAvailableProviders();
            
            if (!isset($providers[$provider])) {
                return response()->json(['error' => 'Provider not found'], 404);
            }

            return response()->json($providers[$provider]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Validate provider configuration.
     */
    public function validateConfig(DomainFormRequest $request): JsonResponse
    {
        $provider = $request->input('dns_provider');
        $config = $request->input('dns_config', []);

        try {
            $errors = $this->dnsManager->validateProviderConfig($provider, $config);
            
            return response()->json([
                'valid' => empty($errors),
                'errors' => $errors
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'valid' => false,
                'errors' => [$e->getMessage()]
            ], 400);
        }
    }
}