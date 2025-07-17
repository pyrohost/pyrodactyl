(function () {
	var laroute = function () {
		var routes = {
			absolute: false,
			rootUrl: 'http://pterodactyl.local',
			routes: [
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: '_debugbar\/open',
					name: 'debugbar.openhandler',
					action: 'Barryvdh\Debugbar\Controllers\OpenHandlerController@handle',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: '_debugbar\/clockwork\/{id}',
					name: 'debugbar.clockwork',
					action:
						'Barryvdh\Debugbar\Controllers\OpenHandlerController@clockwork',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: '_debugbar\/assets\/stylesheets',
					name: 'debugbar.assets.css',
					action: 'Barryvdh\Debugbar\Controllers\AssetController@css',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: '_debugbar\/assets\/javascript',
					name: 'debugbar.assets.js',
					action: 'Barryvdh\Debugbar\Controllers\AssetController@js',
				},
				{
					host: null,
					methods: ['DELETE'],
					uri: '_debugbar\/cache\/{key}\/{tags?}',
					name: 'debugbar.cache.delete',
					action: 'Barryvdh\Debugbar\Controllers\CacheController@delete',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: '\/',
					name: 'index',
					action: 'Pterodactyl\Http\Controllers\Base\IndexController@getIndex',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'status\/{server}',
					name: 'index.status',
					action: 'Pterodactyl\Http\Controllers\Base\IndexController@status',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'account',
					name: 'account',
					action: 'Pterodactyl\Http\Controllers\Base\AccountController@index',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'account',
					name: null,
					action: 'Pterodactyl\Http\Controllers\Base\AccountController@update',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'account\/api',
					name: 'account.api',
					action: 'Pterodactyl\Http\Controllers\Base\ClientApiController@index',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'account\/api\/new',
					name: 'account.api.new',
					action:
						'Pterodactyl\Http\Controllers\Base\ClientApiController@create',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'account\/api\/new',
					name: null,
					action: 'Pterodactyl\Http\Controllers\Base\ClientApiController@store',
				},
				{
					host: null,
					methods: ['DELETE'],
					uri: 'account\/api\/revoke\/{identifier}',
					name: 'account.api.revoke',
					action:
						'Pterodactyl\Http\Controllers\Base\ClientApiController@delete',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'account\/security',
					name: 'account.security',
					action: 'Pterodactyl\Http\Controllers\Base\SecurityController@index',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'account\/security\/revoke\/{id}',
					name: 'account.security.revoke',
					action: 'Pterodactyl\Http\Controllers\Base\SecurityController@revoke',
				},
				{
					host: null,
					methods: ['PUT'],
					uri: 'account\/security\/totp',
					name: 'account.security.totp',
					action:
						'Pterodactyl\Http\Controllers\Base\SecurityController@generateTotp',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'account\/security\/totp',
					name: 'account.security.totp.set',
					action:
						'Pterodactyl\Http\Controllers\Base\SecurityController@setTotp',
				},
				{
					host: null,
					methods: ['DELETE'],
					uri: 'account\/security\/totp',
					name: 'account.security.totp.disable',
					action:
						'Pterodactyl\Http\Controllers\Base\SecurityController@disableTotp',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin',
					name: 'admin.index',
					action: 'Pterodactyl\Http\Controllers\Admin\BaseController@index',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/statistics',
					name: 'admin.statistics',
					action:
						'Pterodactyl\Http\Controllers\Admin\StatisticsController@index',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/api',
					name: 'admin.api.index',
					action: 'Pterodactyl\Http\Controllers\Admin\ApiController@index',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/api\/new',
					name: 'admin.api.new',
					action: 'Pterodactyl\Http\Controllers\Admin\ApiController@create',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'admin\/api\/new',
					name: null,
					action: 'Pterodactyl\Http\Controllers\Admin\ApiController@store',
				},
				{
					host: null,
					methods: ['DELETE'],
					uri: 'admin\/api\/revoke\/{identifier}',
					name: 'admin.api.delete',
					action: 'Pterodactyl\Http\Controllers\Admin\ApiController@delete',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/locations',
					name: 'admin.locations',
					action: 'Pterodactyl\Http\Controllers\Admin\LocationController@index',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/locations\/view\/{location}',
					name: 'admin.locations.view',
					action: 'Pterodactyl\Http\Controllers\Admin\LocationController@view',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'admin\/locations',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Admin\LocationController@create',
				},
				{
					host: null,
					methods: ['PATCH'],
					uri: 'admin\/locations\/view\/{location}',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Admin\LocationController@update',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/databases',
					name: 'admin.databases',
					action: 'Pterodactyl\Http\Controllers\Admin\DatabaseController@index',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/databases\/view\/{host}',
					name: 'admin.databases.view',
					action: 'Pterodactyl\Http\Controllers\Admin\DatabaseController@view',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'admin\/databases',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Admin\DatabaseController@create',
				},
				{
					host: null,
					methods: ['PATCH'],
					uri: 'admin\/databases\/view\/{host}',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Admin\DatabaseController@update',
				},
				{
					host: null,
					methods: ['DELETE'],
					uri: 'admin\/databases\/view\/{host}',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Admin\DatabaseController@delete',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/settings',
					name: 'admin.settings',
					action:
						'Pterodactyl\Http\Controllers\Admin\Settings\IndexController@index',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/settings\/mail',
					name: 'admin.settings.mail',
					action:
						'Pterodactyl\Http\Controllers\Admin\Settings\MailController@index',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/settings\/mail\/test',
					name: 'admin.settings.mail.test',
					action:
						'Pterodactyl\Http\Controllers\Admin\Settings\MailController@test',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/settings\/advanced',
					name: 'admin.settings.advanced',
					action:
						'Pterodactyl\Http\Controllers\Admin\Settings\AdvancedController@index',
				},
				{
					host: null,
					methods: ['PATCH'],
					uri: 'admin\/settings',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Admin\Settings\IndexController@update',
				},
				{
					host: null,
					methods: ['PATCH'],
					uri: 'admin\/settings\/mail',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Admin\Settings\MailController@update',
				},
				{
					host: null,
					methods: ['PATCH'],
					uri: 'admin\/settings\/advanced',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Admin\Settings\AdvancedController@update',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/users',
					name: 'admin.users',
					action: 'Pterodactyl\Http\Controllers\Admin\UserController@index',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/users\/accounts.json',
					name: 'admin.users.json',
					action: 'Pterodactyl\Http\Controllers\Admin\UserController@json',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/users\/new',
					name: 'admin.users.new',
					action: 'Pterodactyl\Http\Controllers\Admin\UserController@create',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/users\/view\/{user}',
					name: 'admin.users.view',
					action: 'Pterodactyl\Http\Controllers\Admin\UserController@view',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'admin\/users\/new',
					name: null,
					action: 'Pterodactyl\Http\Controllers\Admin\UserController@store',
				},
				{
					host: null,
					methods: ['PATCH'],
					uri: 'admin\/users\/view\/{user}',
					name: null,
					action: 'Pterodactyl\Http\Controllers\Admin\UserController@update',
				},
				{
					host: null,
					methods: ['DELETE'],
					uri: 'admin\/users\/view\/{user}',
					name: null,
					action: 'Pterodactyl\Http\Controllers\Admin\UserController@delete',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/servers',
					name: 'admin.servers',
					action: 'Pterodactyl\Http\Controllers\Admin\ServersController@index',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/servers\/new',
					name: 'admin.servers.new',
					action: 'Pterodactyl\Http\Controllers\Admin\ServersController@create',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/servers\/view\/{server}',
					name: 'admin.servers.view',
					action:
						'Pterodactyl\Http\Controllers\Admin\ServersController@viewIndex',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/servers\/view\/{server}\/details',
					name: 'admin.servers.view.details',
					action:
						'Pterodactyl\Http\Controllers\Admin\ServersController@viewDetails',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/servers\/view\/{server}\/build',
					name: 'admin.servers.view.build',
					action:
						'Pterodactyl\Http\Controllers\Admin\ServersController@viewBuild',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/servers\/view\/{server}\/startup',
					name: 'admin.servers.view.startup',
					action:
						'Pterodactyl\Http\Controllers\Admin\ServersController@viewStartup',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/servers\/view\/{server}\/database',
					name: 'admin.servers.view.database',
					action:
						'Pterodactyl\Http\Controllers\Admin\ServersController@viewDatabase',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/servers\/view\/{server}\/manage',
					name: 'admin.servers.view.manage',
					action:
						'Pterodactyl\Http\Controllers\Admin\ServersController@viewManage',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/servers\/view\/{server}\/delete',
					name: 'admin.servers.view.delete',
					action:
						'Pterodactyl\Http\Controllers\Admin\ServersController@viewDelete',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'admin\/servers\/new',
					name: null,
					action: 'Pterodactyl\Http\Controllers\Admin\ServersController@store',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'admin\/servers\/view\/{server}\/build',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Admin\ServersController@updateBuild',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'admin\/servers\/view\/{server}\/startup',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Admin\ServersController@saveStartup',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'admin\/servers\/view\/{server}\/database',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Admin\ServersController@newDatabase',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'admin\/servers\/view\/{server}\/manage\/toggle',
					name: 'admin.servers.view.manage.toggle',
					action:
						'Pterodactyl\Http\Controllers\Admin\ServersController@toggleInstall',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'admin\/servers\/view\/{server}\/manage\/rebuild',
					name: 'admin.servers.view.manage.rebuild',
					action:
						'Pterodactyl\Http\Controllers\Admin\ServersController@rebuildContainer',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'admin\/servers\/view\/{server}\/manage\/suspension',
					name: 'admin.servers.view.manage.suspension',
					action:
						'Pterodactyl\Http\Controllers\Admin\ServersController@manageSuspension',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'admin\/servers\/view\/{server}\/manage\/reinstall',
					name: 'admin.servers.view.manage.reinstall',
					action:
						'Pterodactyl\Http\Controllers\Admin\ServersController@reinstallServer',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'admin\/servers\/view\/{server}\/delete',
					name: null,
					action: 'Pterodactyl\Http\Controllers\Admin\ServersController@delete',
				},
				{
					host: null,
					methods: ['PATCH'],
					uri: 'admin\/servers\/view\/{server}\/details',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Admin\ServersController@setDetails',
				},
				{
					host: null,
					methods: ['PATCH'],
					uri: 'admin\/servers\/view\/{server}\/database',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Admin\ServersController@resetDatabasePassword',
				},
				{
					host: null,
					methods: ['DELETE'],
					uri: 'admin\/servers\/view\/{server}\/database\/{database}\/delete',
					name: 'admin.servers.view.database.delete',
					action:
						'Pterodactyl\Http\Controllers\Admin\ServersController@deleteDatabase',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/nodes',
					name: 'admin.nodes',
					action: 'Pterodactyl\Http\Controllers\Admin\NodesController@index',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/nodes\/new',
					name: 'admin.nodes.new',
					action: 'Pterodactyl\Http\Controllers\Admin\NodesController@create',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/nodes\/view\/{node}',
					name: 'admin.nodes.view',
					action:
						'Pterodactyl\Http\Controllers\Admin\NodesController@viewIndex',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/nodes\/view\/{node}\/settings',
					name: 'admin.nodes.view.settings',
					action:
						'Pterodactyl\Http\Controllers\Admin\NodesController@viewSettings',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/nodes\/view\/{node}\/configuration',
					name: 'admin.nodes.view.configuration',
					action:
						'Pterodactyl\Http\Controllers\Admin\NodesController@viewConfiguration',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/nodes\/view\/{node}\/allocation',
					name: 'admin.nodes.view.allocation',
					action:
						'Pterodactyl\Http\Controllers\Admin\NodesController@viewAllocation',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/nodes\/view\/{node}\/servers',
					name: 'admin.nodes.view.servers',
					action:
						'Pterodactyl\Http\Controllers\Admin\NodesController@viewServers',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/nodes\/view\/{node}\/settings\/token',
					name: 'admin.nodes.view.configuration.token',
					action: 'Pterodactyl\Http\Controllers\Admin\NodesController@setToken',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'admin\/nodes\/new',
					name: null,
					action: 'Pterodactyl\Http\Controllers\Admin\NodesController@store',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'admin\/nodes\/view\/{node}\/allocation',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Admin\NodesController@createAllocation',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'admin\/nodes\/view\/{node}\/allocation\/remove',
					name: 'admin.nodes.view.allocation.removeBlock',
					action:
						'Pterodactyl\Http\Controllers\Admin\NodesController@allocationRemoveBlock',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'admin\/nodes\/view\/{node}\/allocation\/alias',
					name: 'admin.nodes.view.allocation.setAlias',
					action:
						'Pterodactyl\Http\Controllers\Admin\NodesController@allocationSetAlias',
				},
				{
					host: null,
					methods: ['PATCH'],
					uri: 'admin\/nodes\/view\/{node}\/settings',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Admin\NodesController@updateSettings',
				},
				{
					host: null,
					methods: ['DELETE'],
					uri: 'admin\/nodes\/view\/{node}\/delete',
					name: 'admin.nodes.view.delete',
					action: 'Pterodactyl\Http\Controllers\Admin\NodesController@delete',
				},
				{
					host: null,
					methods: ['DELETE'],
					uri: 'admin\/nodes\/view\/{node}\/allocation\/remove\/{allocation}',
					name: 'admin.nodes.view.allocation.removeSingle',
					action:
						'Pterodactyl\Http\Controllers\Admin\NodesController@allocationRemoveSingle',
				},
				{
					host: null,
					methods: ['DELETE'],
					uri: 'admin\/nodes\/view\/{node}\/allocations',
					name: 'admin.nodes.view.allocation.removeMultiple',
					action:
						'Pterodactyl\Http\Controllers\Admin\NodesController@allocationRemoveMultiple',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/nests',
					name: 'admin.nests',
					action:
						'Pterodactyl\Http\Controllers\Admin\Nests\NestController@index',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/nests\/new',
					name: 'admin.nests.new',
					action:
						'Pterodactyl\Http\Controllers\Admin\Nests\NestController@create',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/nests\/view\/{nest}',
					name: 'admin.nests.view',
					action:
						'Pterodactyl\Http\Controllers\Admin\Nests\NestController@view',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/nests\/egg\/new',
					name: 'admin.nests.egg.new',
					action:
						'Pterodactyl\Http\Controllers\Admin\Nests\EggController@create',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/nests\/egg\/{egg}',
					name: 'admin.nests.egg.view',
					action: 'Pterodactyl\Http\Controllers\Admin\Nests\EggController@view',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/nests\/egg\/{egg}\/export',
					name: 'admin.nests.egg.export',
					action:
						'Pterodactyl\Http\Controllers\Admin\Nests\EggShareController@export',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/nests\/egg\/{egg}\/variables',
					name: 'admin.nests.egg.variables',
					action:
						'Pterodactyl\Http\Controllers\Admin\Nests\EggVariableController@view',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/nests\/egg\/{egg}\/scripts',
					name: 'admin.nests.egg.scripts',
					action:
						'Pterodactyl\Http\Controllers\Admin\Nests\EggScriptController@index',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'admin\/nests\/new',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Admin\Nests\NestController@store',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'admin\/nests\/import',
					name: 'admin.nests.egg.import',
					action:
						'Pterodactyl\Http\Controllers\Admin\Nests\EggShareController@import',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'admin\/nests\/egg\/new',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Admin\Nests\EggController@store',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'admin\/nests\/egg\/{egg}\/variables',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Admin\Nests\EggVariableController@store',
				},
				{
					host: null,
					methods: ['PUT'],
					uri: 'admin\/nests\/egg\/{egg}',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Admin\Nests\EggShareController@update',
				},
				{
					host: null,
					methods: ['PATCH'],
					uri: 'admin\/nests\/view\/{nest}',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Admin\Nests\NestController@update',
				},
				{
					host: null,
					methods: ['PATCH'],
					uri: 'admin\/nests\/egg\/{egg}',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Admin\Nests\EggController@update',
				},
				{
					host: null,
					methods: ['PATCH'],
					uri: 'admin\/nests\/egg\/{egg}\/scripts',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Admin\Nests\EggScriptController@update',
				},
				{
					host: null,
					methods: ['PATCH'],
					uri: 'admin\/nests\/egg\/{egg}\/variables\/{variable}',
					name: 'admin.nests.egg.variables.edit',
					action:
						'Pterodactyl\Http\Controllers\Admin\Nests\EggVariableController@update',
				},
				{
					host: null,
					methods: ['DELETE'],
					uri: 'admin\/nests\/view\/{nest}',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Admin\Nests\NestController@destroy',
				},
				{
					host: null,
					methods: ['DELETE'],
					uri: 'admin\/nests\/egg\/{egg}',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Admin\Nests\EggController@destroy',
				},
				{
					host: null,
					methods: ['DELETE'],
					uri: 'admin\/nests\/egg\/{egg}\/variables\/{variable}',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Admin\Nests\EggVariableController@destroy',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/packs',
					name: 'admin.packs',
					action: 'Pterodactyl\Http\Controllers\Admin\PackController@index',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/packs\/new',
					name: 'admin.packs.new',
					action: 'Pterodactyl\Http\Controllers\Admin\PackController@create',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/packs\/new\/template',
					name: 'admin.packs.new.template',
					action:
						'Pterodactyl\Http\Controllers\Admin\PackController@newTemplate',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'admin\/packs\/view\/{pack}',
					name: 'admin.packs.view',
					action: 'Pterodactyl\Http\Controllers\Admin\PackController@view',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'admin\/packs\/new',
					name: null,
					action: 'Pterodactyl\Http\Controllers\Admin\PackController@store',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'admin\/packs\/view\/{pack}\/export\/{files?}',
					name: 'admin.packs.view.export',
					action: 'Pterodactyl\Http\Controllers\Admin\PackController@export',
				},
				{
					host: null,
					methods: ['PATCH'],
					uri: 'admin\/packs\/view\/{pack}',
					name: null,
					action: 'Pterodactyl\Http\Controllers\Admin\PackController@update',
				},
				{
					host: null,
					methods: ['DELETE'],
					uri: 'admin\/packs\/view\/{pack}',
					name: null,
					action: 'Pterodactyl\Http\Controllers\Admin\PackController@destroy',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'auth\/login',
					name: 'auth.login',
					action:
						'Pterodactyl\Http\Controllers\Auth\LoginController@showLoginForm',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'auth\/login\/totp',
					name: 'auth.totp',
					action: 'Pterodactyl\Http\Controllers\Auth\LoginController@totp',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'auth\/password',
					name: 'auth.password',
					action:
						'Pterodactyl\Http\Controllers\Auth\ForgotPasswordController@showLinkRequestForm',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'auth\/password\/reset\/{token}',
					name: 'auth.reset',
					action:
						'Pterodactyl\Http\Controllers\Auth\ResetPasswordController@showResetForm',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'auth\/login',
					name: null,
					action: 'Pterodactyl\Http\Controllers\Auth\LoginController@login',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'auth\/login\/totp',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Auth\LoginController@loginUsingTotp',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'auth\/password',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Auth\ForgotPasswordController@sendResetLinkEmail',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'auth\/password\/reset',
					name: 'auth.reset.post',
					action:
						'Pterodactyl\Http\Controllers\Auth\ResetPasswordController@reset',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'auth\/password\/reset\/{token}',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Auth\ForgotPasswordController@sendResetLinkEmail',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'auth\/logout',
					name: 'auth.logout',
					action: 'Pterodactyl\Http\Controllers\Auth\LoginController@logout',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'server\/{server}',
					name: 'server.index',
					action: 'Pterodactyl\Http\Controllers\Server\ConsoleController@index',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'server\/{server}\/console',
					name: 'server.console',
					action:
						'Pterodactyl\Http\Controllers\Server\ConsoleController@console',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'server\/{server}\/settings\/allocation',
					name: 'server.settings.allocation',
					action:
						'Pterodactyl\Http\Controllers\Server\Settings\AllocationController@index',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'server\/{server}\/settings\/name',
					name: 'server.settings.name',
					action:
						'Pterodactyl\Http\Controllers\Server\Settings\NameController@index',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'server\/{server}\/settings\/sftp',
					name: 'server.settings.sftp',
					action:
						'Pterodactyl\Http\Controllers\Server\Settings\SftpController@index',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'server\/{server}\/settings\/startup',
					name: 'server.settings.startup',
					action:
						'Pterodactyl\Http\Controllers\Server\Settings\StartupController@index',
				},
				{
					host: null,
					methods: ['PATCH'],
					uri: 'server\/{server}\/settings\/allocation',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Server\Settings\AllocationController@update',
				},
				{
					host: null,
					methods: ['PATCH'],
					uri: 'server\/{server}\/settings\/name',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Server\Settings\NameController@update',
				},
				{
					host: null,
					methods: ['PATCH'],
					uri: 'server\/{server}\/settings\/startup',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Server\Settings\StartupController@update',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'server\/{server}\/databases',
					name: 'server.databases.index',
					action:
						'Pterodactyl\Http\Controllers\Server\DatabaseController@index',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'server\/{server}\/databases\/new',
					name: 'server.databases.new',
					action:
						'Pterodactyl\Http\Controllers\Server\DatabaseController@store',
				},
				{
					host: null,
					methods: ['PATCH'],
					uri: 'server\/{server}\/databases\/password',
					name: 'server.databases.password',
					action:
						'Pterodactyl\Http\Controllers\Server\DatabaseController@update',
				},
				{
					host: null,
					methods: ['DELETE'],
					uri: 'server\/{server}\/databases\/delete\/{database}',
					name: 'server.databases.delete',
					action:
						'Pterodactyl\Http\Controllers\Server\DatabaseController@delete',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'server\/{server}\/files',
					name: 'server.files.index',
					action:
						'Pterodactyl\Http\Controllers\Server\Files\FileActionsController@index',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'server\/{server}\/files\/add',
					name: 'server.files.add',
					action:
						'Pterodactyl\Http\Controllers\Server\Files\FileActionsController@create',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'server\/{server}\/files\/edit\/{file}',
					name: 'server.files.edit',
					action:
						'Pterodactyl\Http\Controllers\Server\Files\FileActionsController@view',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'server\/{server}\/files\/download\/{file}',
					name: 'server.files.edit',
					action:
						'Pterodactyl\Http\Controllers\Server\Files\DownloadController@index',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'server\/{server}\/files\/directory-list',
					name: 'server.files.directory-list',
					action:
						'Pterodactyl\Http\Controllers\Server\Files\RemoteRequestController@directory',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'server\/{server}\/files\/save',
					name: 'server.files.save',
					action:
						'Pterodactyl\Http\Controllers\Server\Files\RemoteRequestController@store',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'server\/{server}\/users',
					name: 'server.subusers',
					action: 'Pterodactyl\Http\Controllers\Server\SubuserController@index',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'server\/{server}\/users\/new',
					name: 'server.subusers.new',
					action:
						'Pterodactyl\Http\Controllers\Server\SubuserController@create',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'server\/{server}\/users\/new',
					name: null,
					action: 'Pterodactyl\Http\Controllers\Server\SubuserController@store',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'server\/{server}\/users\/view\/{subuser}',
					name: 'server.subusers.view',
					action: 'Pterodactyl\Http\Controllers\Server\SubuserController@view',
				},
				{
					host: null,
					methods: ['PATCH'],
					uri: 'server\/{server}\/users\/view\/{subuser}',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Server\SubuserController@update',
				},
				{
					host: null,
					methods: ['DELETE'],
					uri: 'server\/{server}\/users\/view\/{subuser}',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Server\SubuserController@delete',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'server\/{server}\/schedules',
					name: 'server.schedules',
					action:
						'Pterodactyl\Http\Controllers\Server\Tasks\TaskManagementController@index',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'server\/{server}\/schedules\/new',
					name: 'server.schedules.new',
					action:
						'Pterodactyl\Http\Controllers\Server\Tasks\TaskManagementController@create',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'server\/{server}\/schedules\/new',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Server\Tasks\TaskManagementController@store',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'server\/{server}\/schedules\/view\/{schedule}',
					name: 'server.schedules.view',
					action:
						'Pterodactyl\Http\Controllers\Server\Tasks\TaskManagementController@view',
				},
				{
					host: null,
					methods: ['PATCH'],
					uri: 'server\/{server}\/schedules\/view\/{schedule}',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Server\Tasks\TaskManagementController@update',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'server\/{server}\/schedules\/view\/{schedule}\/toggle',
					name: 'server.schedules.toggle',
					action:
						'Pterodactyl\Http\Controllers\Server\Tasks\ActionController@toggle',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'server\/{server}\/schedules\/view\/{schedule}\/trigger',
					name: 'server.schedules.trigger',
					action:
						'Pterodactyl\Http\Controllers\Server\Tasks\ActionController@trigger',
				},
				{
					host: null,
					methods: ['DELETE'],
					uri: 'server\/{server}\/schedules\/view\/{schedule}',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Server\Tasks\TaskManagementController@delete',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'api\/application\/users',
					name: 'api.application.users',
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Users\UserController@index',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'api\/application\/users\/{user}',
					name: 'api.application.users.view',
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Users\UserController@view',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'api\/application\/users\/external\/{external_id}',
					name: 'api.application.users.external',
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Users\ExternalUserController@index',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'api\/application\/users',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Users\UserController@store',
				},
				{
					host: null,
					methods: ['PATCH'],
					uri: 'api\/application\/users\/{user}',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Users\UserController@update',
				},
				{
					host: null,
					methods: ['DELETE'],
					uri: 'api\/application\/users\/{user}',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Users\UserController@delete',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'api\/application\/nodes',
					name: 'api.application.nodes',
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Nodes\NodeController@index',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'api\/application\/nodes\/{node}',
					name: 'api.application.nodes.view',
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Nodes\NodeController@view',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'api\/application\/nodes',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Nodes\NodeController@store',
				},
				{
					host: null,
					methods: ['PATCH'],
					uri: 'api\/application\/nodes\/{node}',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Nodes\NodeController@update',
				},
				{
					host: null,
					methods: ['DELETE'],
					uri: 'api\/application\/nodes\/{node}',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Nodes\NodeController@delete',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'api\/application\/nodes\/{node}\/allocations',
					name: 'api.application.allocations',
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Nodes\AllocationController@index',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'api\/application\/nodes\/{node}\/allocations',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Nodes\AllocationController@store',
				},
				{
					host: null,
					methods: ['DELETE'],
					uri: 'api\/application\/nodes\/{node}\/allocations\/{allocation}',
					name: 'api.application.allocations.view',
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Nodes\AllocationController@delete',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'api\/application\/locations',
					name: 'api.applications.locations',
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Locations\LocationController@index',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'api\/application\/locations\/{location}',
					name: 'api.application.locations.view',
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Locations\LocationController@view',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'api\/application\/locations',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Locations\LocationController@store',
				},
				{
					host: null,
					methods: ['PATCH'],
					uri: 'api\/application\/locations\/{location}',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Locations\LocationController@update',
				},
				{
					host: null,
					methods: ['DELETE'],
					uri: 'api\/application\/locations\/{location}',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Locations\LocationController@delete',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'api\/application\/servers',
					name: 'api.application.servers',
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Servers\ServerController@index',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'api\/application\/servers\/{server}',
					name: 'api.application.servers.view',
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Servers\ServerController@view',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'api\/application\/servers\/external\/{external_id}',
					name: 'api.application.servers.external',
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Servers\ExternalServerController@index',
				},
				{
					host: null,
					methods: ['PATCH'],
					uri: 'api\/application\/servers\/{server}\/details',
					name: 'api.application.servers.details',
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Servers\ServerDetailsController@details',
				},
				{
					host: null,
					methods: ['PATCH'],
					uri: 'api\/application\/servers\/{server}\/build',
					name: 'api.application.servers.build',
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Servers\ServerDetailsController@build',
				},
				{
					host: null,
					methods: ['PATCH'],
					uri: 'api\/application\/servers\/{server}\/startup',
					name: 'api.application.servers.startup',
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Servers\StartupController@index',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'api\/application\/servers',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Servers\ServerController@store',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'api\/application\/servers\/{server}\/suspend',
					name: 'api.application.servers.suspend',
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Servers\ServerManagementController@suspend',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'api\/application\/servers\/{server}\/unsuspend',
					name: 'api.application.servers.unsuspend',
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Servers\ServerManagementController@unsuspend',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'api\/application\/servers\/{server}\/reinstall',
					name: 'api.application.servers.reinstall',
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Servers\ServerManagementController@reinstall',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'api\/application\/servers\/{server}\/rebuild',
					name: 'api.application.servers.rebuild',
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Servers\ServerManagementController@rebuild',
				},
				{
					host: null,
					methods: ['DELETE'],
					uri: 'api\/application\/servers\/{server}',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Servers\ServerController@delete',
				},
				{
					host: null,
					methods: ['DELETE'],
					uri: 'api\/application\/servers\/{server}\/{force?}',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Servers\ServerController@delete',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'api\/application\/servers\/{server}\/databases',
					name: 'api.application.servers.databases',
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Servers\DatabaseController@index',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'api\/application\/servers\/{server}\/databases\/{database}',
					name: 'api.application.servers.databases.view',
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Servers\DatabaseController@view',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'api\/application\/servers\/{server}\/databases',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Servers\DatabaseController@store',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'api\/application\/servers\/{server}\/databases\/{database}\/reset-password',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Servers\DatabaseController@resetPassword',
				},
				{
					host: null,
					methods: ['DELETE'],
					uri: 'api\/application\/servers\/{server}\/databases\/{database}',
					name: null,
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Servers\DatabaseController@delete',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'api\/application\/nests',
					name: 'api.application.nests',
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Nests\NestController@index',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'api\/application\/nests\/{nest}',
					name: 'api.application.nests.view',
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Nests\NestController@view',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'api\/application\/nests\/{nest}\/eggs',
					name: 'api.application.nests.eggs',
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Nests\EggController@index',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'api\/application\/nests\/{nest}\/eggs\/{egg}',
					name: 'api.application.nests.eggs.view',
					action:
						'Pterodactyl\Http\Controllers\Api\Application\Nests\EggController@view',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'api\/client',
					name: 'api.client.index',
					action:
						'Pterodactyl\Http\Controllers\Api\Client\ClientController@index',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'api\/client\/servers\/{server}',
					name: 'api.client.servers.view',
					action:
						'Pterodactyl\Http\Controllers\Api\Client\Servers\ServerController@index',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'api\/client\/servers\/{server}\/utilization',
					name: 'api.client.servers.resources',
					action:
						'Pterodactyl\Http\Controllers\Api\Client\Servers\ResourceUtilizationController@index',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'api\/client\/servers\/{server}\/command',
					name: 'api.client.servers.command',
					action:
						'Pterodactyl\Http\Controllers\Api\Client\Servers\CommandController@index',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'api\/client\/servers\/{server}\/power',
					name: 'api.client.servers.power',
					action:
						'Pterodactyl\Http\Controllers\Api\Client\Servers\PowerController@index',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'api\/remote\/authenticate\/{token}',
					name: 'api.remote.authenticate',
					action:
						'Pterodactyl\Http\Controllers\Api\Remote\ValidateKeyController@index',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'api\/remote\/download-file',
					name: 'api.remote.download_file',
					action:
						'Pterodactyl\Http\Controllers\Api\Remote\FileDownloadController@index',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'api\/remote\/eggs',
					name: 'api.remote.eggs',
					action:
						'Pterodactyl\Http\Controllers\Api\Remote\EggRetrievalController@index',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'api\/remote\/eggs\/{uuid}',
					name: 'api.remote.eggs.download',
					action:
						'Pterodactyl\Http\Controllers\Api\Remote\EggRetrievalController@download',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'api\/remote\/scripts\/{uuid}',
					name: 'api.remote.scripts',
					action:
						'Pterodactyl\Http\Controllers\Api\Remote\EggInstallController@index',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'api\/remote\/sftp',
					name: 'api.remote.sftp',
					action:
						'Pterodactyl\Http\Controllers\Api\Remote\SftpController@index',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'daemon\/packs\/pull\/{uuid}',
					name: 'daemon.pack.pull',
					action: 'Pterodactyl\Http\Controllers\Daemon\PackController@pull',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'daemon\/packs\/pull\/{uuid}\/hash',
					name: 'daemon.pack.hash',
					action: 'Pterodactyl\Http\Controllers\Daemon\PackController@hash',
				},
				{
					host: null,
					methods: ['GET', 'HEAD'],
					uri: 'daemon\/configure\/{token}',
					name: 'daemon.configuration',
					action:
						'Pterodactyl\Http\Controllers\Daemon\ActionController@configuration',
				},
				{
					host: null,
					methods: ['POST'],
					uri: 'daemon\/install',
					name: 'daemon.install',
					action:
						'Pterodactyl\Http\Controllers\Daemon\ActionController@markInstall',
				},
			],
			prefix: '',

			route: function (name, parameters, route) {
				route = route || this.getByName(name);

				if (!route) {
					return undefined;
				}

				return this.toRoute(route, parameters);
			},

			url: function (url, parameters) {
				parameters = parameters || [];

				var uri = url + '/' + parameters.join('/');

				return this.getCorrectUrl(uri);
			},

			toRoute: function (route, parameters) {
				var uri = this.replaceNamedParameters(route.uri, parameters);
				var qs = this.getRouteQueryString(parameters);

				if (this.absolute && this.isOtherHost(route)) {
					return '//' + route.host + '/' + uri + qs;
				}

				return this.getCorrectUrl(uri + qs);
			},

			isOtherHost: function (route) {
				return route.host && route.host != window.location.hostname;
			},

			replaceNamedParameters: function (uri, parameters) {
				uri = uri.replace(/\{(.*?)\??\}/g, function (match, key) {
					if (parameters.hasOwnProperty(key)) {
						var value = parameters[key];
						delete parameters[key];
						return value;
					} else {
						return match;
					}
				});

				// Strip out any optional parameters that were not given
				uri = uri.replace(/\/\{.*?\?\}/g, '');

				return uri;
			},

			getRouteQueryString: function (parameters) {
				var qs = [];
				for (var key in parameters) {
					if (parameters.hasOwnProperty(key)) {
						qs.push(key + '=' + parameters[key]);
					}
				}

				if (qs.length < 1) {
					return '';
				}

				return '?' + qs.join('&');
			},

			getByName: function (name) {
				for (var key in this.routes) {
					if (
						this.routes.hasOwnProperty(key) &&
						this.routes[key].name === name
					) {
						return this.routes[key];
					}
				}
			},

			getByAction: function (action) {
				for (var key in this.routes) {
					if (
						this.routes.hasOwnProperty(key) &&
						this.routes[key].action === action
					) {
						return this.routes[key];
					}
				}
			},

			getCorrectUrl: function (uri) {
				var url = this.prefix + '/' + uri.replace(/^\/?/, '');

				if (!this.absolute) {
					return url;
				}

				return this.rootUrl.replace('/\/?$/', '') + url;
			},
		};

		var getLinkAttributes = function (attributes) {
			if (!attributes) {
				return '';
			}

			var attrs = [];
			for (var key in attributes) {
				if (attributes.hasOwnProperty(key)) {
					attrs.push(key + '="' + attributes[key] + '"');
				}
			}

			return attrs.join(' ');
		};

		var getHtmlLink = function (url, title, attributes) {
			title = title || url;
			attributes = getLinkAttributes(attributes);

			return '<a href="' + url + '" ' + attributes + '>' + title + '</a>';
		};

		return {
			// Generate a url for a given controller action.
			// Router.action('HomeController@getIndex', [params = {}])
			action: function (name, parameters) {
				parameters = parameters || {};

				return routes.route(name, parameters, routes.getByAction(name));
			},

			// Generate a url for a given named route.
			// Router.route('routeName', [params = {}])
			route: function (route, parameters) {
				parameters = parameters || {};

				return routes.route(route, parameters);
			},

			// Generate a fully qualified URL to the given path.
			// Router.route('url', [params = {}])
			url: function (route, parameters) {
				parameters = parameters || {};

				return routes.url(route, parameters);
			},

			// Generate a html link to the given url.
			// Router.link_to('foo/bar', [title = url], [attributes = {}])
			link_to: function (url, title, attributes) {
				url = this.url(url);

				return getHtmlLink(url, title, attributes);
			},

			// Generate a html link to the given route.
			// Router.link_to_route('route.name', [title=url], [parameters = {}], [attributes = {}])
			link_to_route: function (route, title, parameters, attributes) {
				var url = this.route(route, parameters);

				return getHtmlLink(url, title, attributes);
			},

			// Generate a html link to the given controller action.
			// Router.link_to_action('HomeController@getIndex', [title=url], [parameters = {}], [attributes = {}])
			link_to_action: function (action, title, parameters, attributes) {
				var url = this.action(action, parameters);

				return getHtmlLink(url, title, attributes);
			},
		};
	}.call(this);

	/**
	 * Expose the class either via AMD, CommonJS or the global object
	 */
	if (typeof define === 'function' && define.amd) {
		define(function () {
			return laroute;
		});
	} else if (typeof module === 'object' && module.exports) {
		module.exports = laroute;
	} else {
		window.Router = laroute;
	}
}).call(this);
