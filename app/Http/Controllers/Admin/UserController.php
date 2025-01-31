<?php

namespace Pterodactyl\Http\Controllers\Admin;

use Illuminate\View\View;
use Illuminate\Http\Request;
use IInertia\Inertia;
use Pterodactyl\Models\User;
use Pterodactyl\Models\Model;
use Illuminate\Support\Collection;
use Illuminate\Http\RedirectResponse;
use Prologue\Alerts\AlertsMessageBag;
use Spatie\QueryBuilder\QueryBuilder;
use Illuminate\View\Factory as ViewFactory;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Http\Controllers\Controller;
use Illuminate\Contracts\Translation\Translator;
use Pterodactyl\Services\Users\UserUpdateService;
use Pterodactyl\Traits\Helpers\AvailableLanguages;
use Pterodactyl\Services\Users\UserCreationService;
use Pterodactyl\Services\Users\UserDeletionService;
use Pterodactyl\Http\Requests\Admin\UserFormRequest;
use Pterodactyl\Http\Requests\Admin\NewUserFormRequest;
use Pterodactyl\Contracts\Repository\UserRepositoryInterface;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;


class UserController extends Controller
{
    use AvailableLanguages;

    /**
     * UserController constructor.
     */
    public function __construct(
        protected AlertsMessageBag $alert,
        protected UserCreationService $creationService,
        protected UserDeletionService $deletionService,
        protected Translator $translator,
        protected UserUpdateService $updateService,
        protected UserRepositoryInterface $repository,
        protected ViewFactory $view
    ) {
    }

    /**
     * Display user index page.
     */
    public function index(Request $request): View
    {
        $users = QueryBuilder::for(
            User::query()->select('users.*')
                ->selectRaw('COUNT(DISTINCT(subusers.id)) as subuser_of_count')
                ->selectRaw('COUNT(DISTINCT(servers.id)) as servers_count')
                ->leftJoin('subusers', 'subusers.user_id', '=', 'users.id')
                ->leftJoin('servers', 'servers.owner_id', '=', 'users.id')
                ->groupBy('users.id')
        )
            ->allowedFilters(['username', 'email', 'uuid'])
            ->allowedSorts(['id', 'uuid'])
            ->paginate(50);

        return $this->view->make('admin.users.index', ['users' => $users]);
    }

    /**
     * Display new user page.
     */
    public function create(): View
    {
        return $this->view->make('admin.users.new', [
            'languages' => $this->getAvailableLanguages(true),
        ]);
    }

    /**
     * Display user view page.
     */
    public function view(User $user)
{
    return inertia('Admin/User/user.view', [
        'user' => $user->load(['servers'])->toArray()
    ]);
}

    /**
     * Delete a user from the system.
     *
     * @throws \Exception
     * @throws \Pterodactyl\Exceptions\DisplayException
     */
    public function delete(Request $request, User $user): RedirectResponse
    {
        if ($request->user()->id === $user->id) {
            throw new DisplayException($this->translator->get('admin/user.exceptions.user_has_servers'));
        }

        $this->deletionService->handle($user);

        return redirect()->route('admin.users');
    }

    /**
     * Create a user.
     *
     * @throws \Exception
     * @throws \Throwable
     */
    public function store(NewUserFormRequest $request): RedirectResponse
    {
        $user = $this->creationService->handle($request->normalize());
        $this->alert->success($this->translator->get('admin/user.notices.account_created'))->flash();

        return redirect()->route('admin.users.view', $user->id);
    }

    /**
     * Update a user on the system. 
     * The user's resources and limits are updated. later implment to update plans
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     * @throws \Pterodactyl\Exceptions\Repository\RecordNotFoundException
     */
    public function update(Request $request, User $user): RedirectResponse
{
    try {
        $validated = $request->validate([
            'email' => 'required|email|unique:users,email,' . $user->id,
            'username' => 'required|string|min:3|unique:users,username,' . $user->id,
            'name_first' => 'required|string',
            'name_last' => 'required|string',
            'password' => 'sometimes|string|min:8|confirmed',
            'language' => 'required|string',
            'root_admin' => 'boolean',
            'coins' => 'required|numeric',
            'limits' => 'required|array',
            'resources' => 'required|array'
        ]);
    
        // Update basic info
        $user->email = $validated['email'];
        $user->username = $validated['username'];
        $user->name_first = $validated['name_first'];
        $user->name_last = $validated['name_last'];
        $user->language = $validated['language'];
        $user->root_admin = $validated['root_admin'];
        $user->coins = $validated['coins'];
        $user->limits = $validated['limits'];
        $user->resources = $validated['resources'];
    
        // Update password if provided
        if (isset($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }
    
        $user->save();

        

        $this->updateService
            ->setUserLevel(User::USER_LEVEL_ADMIN)
            ->handle($user, $data);

        return redirect()->back()->with('success', 'User updated successfully');
    } catch (\Exception $e) {
        return redirect()->back()->withErrors(['error' => $e->getMessage()]);
    }
}

    /**
     * Get a JSON response of users on the system.
     */
    public function json(Request $request): Model|Collection
{
    $users = QueryBuilder::for(User::query())
        ->allowedFilters(['email', 'username'])
        ->select(['id', 'email', 'username', 'name_first', 'name_last', 'root_admin', 'language', 'resources', 'limits', 'purchases_plans', 'coins'])
        ->paginate(25);

    if ($request->query('user_id')) {
        $user = User::query()->findOrFail($request->input('user_id'));
        $user->md5 = md5(strtolower($user->email));
        return $user;
    }

    return $users->map(function ($item) {
        $item->md5 = md5(strtolower($item->email));
        return $item;
    });
}

    
}
