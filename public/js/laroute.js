(function () {
	var laroute = (() => {
		var routes = {
			absolute: false,
			rootUrl: "http://pterodactyl.local",
			routes: [
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "_debugbar/open",
					name: "debugbar.openhandler",
					action: "BarryvdhDebugbarControllersOpenHandlerController@handle",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "_debugbar/clockwork/{id}",
					name: "debugbar.clockwork",
					action: "BarryvdhDebugbarControllersOpenHandlerController@clockwork",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "_debugbar/assets/stylesheets",
					name: "debugbar.assets.css",
					action: "BarryvdhDebugbarControllersAssetController@css",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "_debugbar/assets/javascript",
					name: "debugbar.assets.js",
					action: "BarryvdhDebugbarControllersAssetController@js",
				},
				{
					host: null,
					methods: ["DELETE"],
					uri: "_debugbar/cache/{key}/{tags?}",
					name: "debugbar.cache.delete",
					action: "BarryvdhDebugbarControllersCacheController@delete",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "/",
					name: "index",
					action: "PterodactylHttpControllersBaseIndexController@getIndex",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "status/{server}",
					name: "index.status",
					action: "PterodactylHttpControllersBaseIndexController@status",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "account",
					name: "account",
					action: "PterodactylHttpControllersBaseAccountController@index",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "account",
					name: null,
					action: "PterodactylHttpControllersBaseAccountController@update",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "account/api",
					name: "account.api",
					action: "PterodactylHttpControllersBaseClientApiController@index",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "account/api/new",
					name: "account.api.new",
					action: "PterodactylHttpControllersBaseClientApiController@create",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "account/api/new",
					name: null,
					action: "PterodactylHttpControllersBaseClientApiController@store",
				},
				{
					host: null,
					methods: ["DELETE"],
					uri: "account/api/revoke/{identifier}",
					name: "account.api.revoke",
					action: "PterodactylHttpControllersBaseClientApiController@delete",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "account/security",
					name: "account.security",
					action: "PterodactylHttpControllersBaseSecurityController@index",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "account/security/revoke/{id}",
					name: "account.security.revoke",
					action: "PterodactylHttpControllersBaseSecurityController@revoke",
				},
				{
					host: null,
					methods: ["PUT"],
					uri: "account/security/totp",
					name: "account.security.totp",
					action:
						"PterodactylHttpControllersBaseSecurityController@generateTotp",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "account/security/totp",
					name: "account.security.totp.set",
					action: "PterodactylHttpControllersBaseSecurityController@setTotp",
				},
				{
					host: null,
					methods: ["DELETE"],
					uri: "account/security/totp",
					name: "account.security.totp.disable",
					action:
						"PterodactylHttpControllersBaseSecurityController@disableTotp",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin",
					name: "admin.index",
					action: "PterodactylHttpControllersAdminBaseController@index",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/statistics",
					name: "admin.statistics",
					action: "PterodactylHttpControllersAdminStatisticsController@index",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/api",
					name: "admin.api.index",
					action: "PterodactylHttpControllersAdminApiController@index",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/api/new",
					name: "admin.api.new",
					action: "PterodactylHttpControllersAdminApiController@create",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "admin/api/new",
					name: null,
					action: "PterodactylHttpControllersAdminApiController@store",
				},
				{
					host: null,
					methods: ["DELETE"],
					uri: "admin/api/revoke/{identifier}",
					name: "admin.api.delete",
					action: "PterodactylHttpControllersAdminApiController@delete",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/locations",
					name: "admin.locations",
					action: "PterodactylHttpControllersAdminLocationController@index",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/locations/view/{location}",
					name: "admin.locations.view",
					action: "PterodactylHttpControllersAdminLocationController@view",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "admin/locations",
					name: null,
					action: "PterodactylHttpControllersAdminLocationController@create",
				},
				{
					host: null,
					methods: ["PATCH"],
					uri: "admin/locations/view/{location}",
					name: null,
					action: "PterodactylHttpControllersAdminLocationController@update",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/databases",
					name: "admin.databases",
					action: "PterodactylHttpControllersAdminDatabaseController@index",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/databases/view/{host}",
					name: "admin.databases.view",
					action: "PterodactylHttpControllersAdminDatabaseController@view",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "admin/databases",
					name: null,
					action: "PterodactylHttpControllersAdminDatabaseController@create",
				},
				{
					host: null,
					methods: ["PATCH"],
					uri: "admin/databases/view/{host}",
					name: null,
					action: "PterodactylHttpControllersAdminDatabaseController@update",
				},
				{
					host: null,
					methods: ["DELETE"],
					uri: "admin/databases/view/{host}",
					name: null,
					action: "PterodactylHttpControllersAdminDatabaseController@delete",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/settings",
					name: "admin.settings",
					action:
						"PterodactylHttpControllersAdminSettingsIndexController@index",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/settings/mail",
					name: "admin.settings.mail",
					action: "PterodactylHttpControllersAdminSettingsMailController@index",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/settings/mail/test",
					name: "admin.settings.mail.test",
					action: "PterodactylHttpControllersAdminSettingsMailController@test",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/settings/advanced",
					name: "admin.settings.advanced",
					action:
						"PterodactylHttpControllersAdminSettingsAdvancedController@index",
				},
				{
					host: null,
					methods: ["PATCH"],
					uri: "admin/settings",
					name: null,
					action:
						"PterodactylHttpControllersAdminSettingsIndexController@update",
				},
				{
					host: null,
					methods: ["PATCH"],
					uri: "admin/settings/mail",
					name: null,
					action:
						"PterodactylHttpControllersAdminSettingsMailController@update",
				},
				{
					host: null,
					methods: ["PATCH"],
					uri: "admin/settings/advanced",
					name: null,
					action:
						"PterodactylHttpControllersAdminSettingsAdvancedController@update",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/users",
					name: "admin.users",
					action: "PterodactylHttpControllersAdminUserController@index",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/users/accounts.json",
					name: "admin.users.json",
					action: "PterodactylHttpControllersAdminUserController@json",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/users/new",
					name: "admin.users.new",
					action: "PterodactylHttpControllersAdminUserController@create",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/users/view/{user}",
					name: "admin.users.view",
					action: "PterodactylHttpControllersAdminUserController@view",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "admin/users/new",
					name: null,
					action: "PterodactylHttpControllersAdminUserController@store",
				},
				{
					host: null,
					methods: ["PATCH"],
					uri: "admin/users/view/{user}",
					name: null,
					action: "PterodactylHttpControllersAdminUserController@update",
				},
				{
					host: null,
					methods: ["DELETE"],
					uri: "admin/users/view/{user}",
					name: null,
					action: "PterodactylHttpControllersAdminUserController@delete",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/servers",
					name: "admin.servers",
					action: "PterodactylHttpControllersAdminServersController@index",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/servers/new",
					name: "admin.servers.new",
					action: "PterodactylHttpControllersAdminServersController@create",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/servers/view/{server}",
					name: "admin.servers.view",
					action: "PterodactylHttpControllersAdminServersController@viewIndex",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/servers/view/{server}/details",
					name: "admin.servers.view.details",
					action:
						"PterodactylHttpControllersAdminServersController@viewDetails",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/servers/view/{server}/build",
					name: "admin.servers.view.build",
					action: "PterodactylHttpControllersAdminServersController@viewBuild",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/servers/view/{server}/startup",
					name: "admin.servers.view.startup",
					action:
						"PterodactylHttpControllersAdminServersController@viewStartup",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/servers/view/{server}/database",
					name: "admin.servers.view.database",
					action:
						"PterodactylHttpControllersAdminServersController@viewDatabase",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/servers/view/{server}/manage",
					name: "admin.servers.view.manage",
					action: "PterodactylHttpControllersAdminServersController@viewManage",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/servers/view/{server}/delete",
					name: "admin.servers.view.delete",
					action: "PterodactylHttpControllersAdminServersController@viewDelete",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "admin/servers/new",
					name: null,
					action: "PterodactylHttpControllersAdminServersController@store",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "admin/servers/view/{server}/build",
					name: null,
					action:
						"PterodactylHttpControllersAdminServersController@updateBuild",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "admin/servers/view/{server}/startup",
					name: null,
					action:
						"PterodactylHttpControllersAdminServersController@saveStartup",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "admin/servers/view/{server}/database",
					name: null,
					action:
						"PterodactylHttpControllersAdminServersController@newDatabase",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "admin/servers/view/{server}/manage/toggle",
					name: "admin.servers.view.manage.toggle",
					action:
						"PterodactylHttpControllersAdminServersController@toggleInstall",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "admin/servers/view/{server}/manage/rebuild",
					name: "admin.servers.view.manage.rebuild",
					action:
						"PterodactylHttpControllersAdminServersController@rebuildContainer",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "admin/servers/view/{server}/manage/suspension",
					name: "admin.servers.view.manage.suspension",
					action:
						"PterodactylHttpControllersAdminServersController@manageSuspension",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "admin/servers/view/{server}/manage/reinstall",
					name: "admin.servers.view.manage.reinstall",
					action:
						"PterodactylHttpControllersAdminServersController@reinstallServer",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "admin/servers/view/{server}/delete",
					name: null,
					action: "PterodactylHttpControllersAdminServersController@delete",
				},
				{
					host: null,
					methods: ["PATCH"],
					uri: "admin/servers/view/{server}/details",
					name: null,
					action: "PterodactylHttpControllersAdminServersController@setDetails",
				},
				{
					host: null,
					methods: ["PATCH"],
					uri: "admin/servers/view/{server}/database",
					name: null,
					action:
						"PterodactylHttpControllersAdminServersController@resetDatabasePassword",
				},
				{
					host: null,
					methods: ["DELETE"],
					uri: "admin/servers/view/{server}/database/{database}/delete",
					name: "admin.servers.view.database.delete",
					action:
						"PterodactylHttpControllersAdminServersController@deleteDatabase",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/nodes",
					name: "admin.nodes",
					action: "PterodactylHttpControllersAdminNodesController@index",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/nodes/new",
					name: "admin.nodes.new",
					action: "PterodactylHttpControllersAdminNodesController@create",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/nodes/view/{node}",
					name: "admin.nodes.view",
					action: "PterodactylHttpControllersAdminNodesController@viewIndex",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/nodes/view/{node}/settings",
					name: "admin.nodes.view.settings",
					action: "PterodactylHttpControllersAdminNodesController@viewSettings",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/nodes/view/{node}/configuration",
					name: "admin.nodes.view.configuration",
					action:
						"PterodactylHttpControllersAdminNodesController@viewConfiguration",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/nodes/view/{node}/allocation",
					name: "admin.nodes.view.allocation",
					action:
						"PterodactylHttpControllersAdminNodesController@viewAllocation",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/nodes/view/{node}/servers",
					name: "admin.nodes.view.servers",
					action: "PterodactylHttpControllersAdminNodesController@viewServers",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/nodes/view/{node}/settings/token",
					name: "admin.nodes.view.configuration.token",
					action: "PterodactylHttpControllersAdminNodesController@setToken",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "admin/nodes/new",
					name: null,
					action: "PterodactylHttpControllersAdminNodesController@store",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "admin/nodes/view/{node}/allocation",
					name: null,
					action:
						"PterodactylHttpControllersAdminNodesController@createAllocation",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "admin/nodes/view/{node}/allocation/remove",
					name: "admin.nodes.view.allocation.removeBlock",
					action:
						"PterodactylHttpControllersAdminNodesController@allocationRemoveBlock",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "admin/nodes/view/{node}/allocation/alias",
					name: "admin.nodes.view.allocation.setAlias",
					action:
						"PterodactylHttpControllersAdminNodesController@allocationSetAlias",
				},
				{
					host: null,
					methods: ["PATCH"],
					uri: "admin/nodes/view/{node}/settings",
					name: null,
					action:
						"PterodactylHttpControllersAdminNodesController@updateSettings",
				},
				{
					host: null,
					methods: ["DELETE"],
					uri: "admin/nodes/view/{node}/delete",
					name: "admin.nodes.view.delete",
					action: "PterodactylHttpControllersAdminNodesController@delete",
				},
				{
					host: null,
					methods: ["DELETE"],
					uri: "admin/nodes/view/{node}/allocation/remove/{allocation}",
					name: "admin.nodes.view.allocation.removeSingle",
					action:
						"PterodactylHttpControllersAdminNodesController@allocationRemoveSingle",
				},
				{
					host: null,
					methods: ["DELETE"],
					uri: "admin/nodes/view/{node}/allocations",
					name: "admin.nodes.view.allocation.removeMultiple",
					action:
						"PterodactylHttpControllersAdminNodesController@allocationRemoveMultiple",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/nests",
					name: "admin.nests",
					action: "PterodactylHttpControllersAdminNestsNestController@index",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/nests/new",
					name: "admin.nests.new",
					action: "PterodactylHttpControllersAdminNestsNestController@create",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/nests/view/{nest}",
					name: "admin.nests.view",
					action: "PterodactylHttpControllersAdminNestsNestController@view",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/nests/egg/new",
					name: "admin.nests.egg.new",
					action: "PterodactylHttpControllersAdminNestsEggController@create",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/nests/egg/{egg}",
					name: "admin.nests.egg.view",
					action: "PterodactylHttpControllersAdminNestsEggController@view",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/nests/egg/{egg}/export",
					name: "admin.nests.egg.export",
					action:
						"PterodactylHttpControllersAdminNestsEggShareController@export",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/nests/egg/{egg}/variables",
					name: "admin.nests.egg.variables",
					action:
						"PterodactylHttpControllersAdminNestsEggVariableController@view",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/nests/egg/{egg}/scripts",
					name: "admin.nests.egg.scripts",
					action:
						"PterodactylHttpControllersAdminNestsEggScriptController@index",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "admin/nests/new",
					name: null,
					action: "PterodactylHttpControllersAdminNestsNestController@store",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "admin/nests/import",
					name: "admin.nests.egg.import",
					action:
						"PterodactylHttpControllersAdminNestsEggShareController@import",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "admin/nests/egg/new",
					name: null,
					action: "PterodactylHttpControllersAdminNestsEggController@store",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "admin/nests/egg/{egg}/variables",
					name: null,
					action:
						"PterodactylHttpControllersAdminNestsEggVariableController@store",
				},
				{
					host: null,
					methods: ["PUT"],
					uri: "admin/nests/egg/{egg}",
					name: null,
					action:
						"PterodactylHttpControllersAdminNestsEggShareController@update",
				},
				{
					host: null,
					methods: ["PATCH"],
					uri: "admin/nests/view/{nest}",
					name: null,
					action: "PterodactylHttpControllersAdminNestsNestController@update",
				},
				{
					host: null,
					methods: ["PATCH"],
					uri: "admin/nests/egg/{egg}",
					name: null,
					action: "PterodactylHttpControllersAdminNestsEggController@update",
				},
				{
					host: null,
					methods: ["PATCH"],
					uri: "admin/nests/egg/{egg}/scripts",
					name: null,
					action:
						"PterodactylHttpControllersAdminNestsEggScriptController@update",
				},
				{
					host: null,
					methods: ["PATCH"],
					uri: "admin/nests/egg/{egg}/variables/{variable}",
					name: "admin.nests.egg.variables.edit",
					action:
						"PterodactylHttpControllersAdminNestsEggVariableController@update",
				},
				{
					host: null,
					methods: ["DELETE"],
					uri: "admin/nests/view/{nest}",
					name: null,
					action: "PterodactylHttpControllersAdminNestsNestController@destroy",
				},
				{
					host: null,
					methods: ["DELETE"],
					uri: "admin/nests/egg/{egg}",
					name: null,
					action: "PterodactylHttpControllersAdminNestsEggController@destroy",
				},
				{
					host: null,
					methods: ["DELETE"],
					uri: "admin/nests/egg/{egg}/variables/{variable}",
					name: null,
					action:
						"PterodactylHttpControllersAdminNestsEggVariableController@destroy",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/packs",
					name: "admin.packs",
					action: "PterodactylHttpControllersAdminPackController@index",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/packs/new",
					name: "admin.packs.new",
					action: "PterodactylHttpControllersAdminPackController@create",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/packs/new/template",
					name: "admin.packs.new.template",
					action: "PterodactylHttpControllersAdminPackController@newTemplate",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "admin/packs/view/{pack}",
					name: "admin.packs.view",
					action: "PterodactylHttpControllersAdminPackController@view",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "admin/packs/new",
					name: null,
					action: "PterodactylHttpControllersAdminPackController@store",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "admin/packs/view/{pack}/export/{files?}",
					name: "admin.packs.view.export",
					action: "PterodactylHttpControllersAdminPackController@export",
				},
				{
					host: null,
					methods: ["PATCH"],
					uri: "admin/packs/view/{pack}",
					name: null,
					action: "PterodactylHttpControllersAdminPackController@update",
				},
				{
					host: null,
					methods: ["DELETE"],
					uri: "admin/packs/view/{pack}",
					name: null,
					action: "PterodactylHttpControllersAdminPackController@destroy",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "auth/login",
					name: "auth.login",
					action: "PterodactylHttpControllersAuthLoginController@showLoginForm",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "auth/login/totp",
					name: "auth.totp",
					action: "PterodactylHttpControllersAuthLoginController@totp",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "auth/password",
					name: "auth.password",
					action:
						"PterodactylHttpControllersAuthForgotPasswordController@showLinkRequestForm",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "auth/password/reset/{token}",
					name: "auth.reset",
					action:
						"PterodactylHttpControllersAuthResetPasswordController@showResetForm",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "auth/login",
					name: null,
					action: "PterodactylHttpControllersAuthLoginController@login",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "auth/login/totp",
					name: null,
					action:
						"PterodactylHttpControllersAuthLoginController@loginUsingTotp",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "auth/password",
					name: null,
					action:
						"PterodactylHttpControllersAuthForgotPasswordController@sendResetLinkEmail",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "auth/password/reset",
					name: "auth.reset.post",
					action: "PterodactylHttpControllersAuthResetPasswordController@reset",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "auth/password/reset/{token}",
					name: null,
					action:
						"PterodactylHttpControllersAuthForgotPasswordController@sendResetLinkEmail",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "auth/logout",
					name: "auth.logout",
					action: "PterodactylHttpControllersAuthLoginController@logout",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "server/{server}",
					name: "server.index",
					action: "PterodactylHttpControllersServerConsoleController@index",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "server/{server}/console",
					name: "server.console",
					action: "PterodactylHttpControllersServerConsoleController@console",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "server/{server}/settings/allocation",
					name: "server.settings.allocation",
					action:
						"PterodactylHttpControllersServerSettingsAllocationController@index",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "server/{server}/settings/name",
					name: "server.settings.name",
					action:
						"PterodactylHttpControllersServerSettingsNameController@index",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "server/{server}/settings/sftp",
					name: "server.settings.sftp",
					action:
						"PterodactylHttpControllersServerSettingsSftpController@index",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "server/{server}/settings/startup",
					name: "server.settings.startup",
					action:
						"PterodactylHttpControllersServerSettingsStartupController@index",
				},
				{
					host: null,
					methods: ["PATCH"],
					uri: "server/{server}/settings/allocation",
					name: null,
					action:
						"PterodactylHttpControllersServerSettingsAllocationController@update",
				},
				{
					host: null,
					methods: ["PATCH"],
					uri: "server/{server}/settings/name",
					name: null,
					action:
						"PterodactylHttpControllersServerSettingsNameController@update",
				},
				{
					host: null,
					methods: ["PATCH"],
					uri: "server/{server}/settings/startup",
					name: null,
					action:
						"PterodactylHttpControllersServerSettingsStartupController@update",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "server/{server}/databases",
					name: "server.databases.index",
					action: "PterodactylHttpControllersServerDatabaseController@index",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "server/{server}/databases/new",
					name: "server.databases.new",
					action: "PterodactylHttpControllersServerDatabaseController@store",
				},
				{
					host: null,
					methods: ["PATCH"],
					uri: "server/{server}/databases/password",
					name: "server.databases.password",
					action: "PterodactylHttpControllersServerDatabaseController@update",
				},
				{
					host: null,
					methods: ["DELETE"],
					uri: "server/{server}/databases/delete/{database}",
					name: "server.databases.delete",
					action: "PterodactylHttpControllersServerDatabaseController@delete",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "server/{server}/files",
					name: "server.files.index",
					action:
						"PterodactylHttpControllersServerFilesFileActionsController@index",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "server/{server}/files/add",
					name: "server.files.add",
					action:
						"PterodactylHttpControllersServerFilesFileActionsController@create",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "server/{server}/files/edit/{file}",
					name: "server.files.edit",
					action:
						"PterodactylHttpControllersServerFilesFileActionsController@view",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "server/{server}/files/download/{file}",
					name: "server.files.edit",
					action:
						"PterodactylHttpControllersServerFilesDownloadController@index",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "server/{server}/files/directory-list",
					name: "server.files.directory-list",
					action:
						"PterodactylHttpControllersServerFilesRemoteRequestController@directory",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "server/{server}/files/save",
					name: "server.files.save",
					action:
						"PterodactylHttpControllersServerFilesRemoteRequestController@store",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "server/{server}/users",
					name: "server.subusers",
					action: "PterodactylHttpControllersServerSubuserController@index",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "server/{server}/users/new",
					name: "server.subusers.new",
					action: "PterodactylHttpControllersServerSubuserController@create",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "server/{server}/users/new",
					name: null,
					action: "PterodactylHttpControllersServerSubuserController@store",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "server/{server}/users/view/{subuser}",
					name: "server.subusers.view",
					action: "PterodactylHttpControllersServerSubuserController@view",
				},
				{
					host: null,
					methods: ["PATCH"],
					uri: "server/{server}/users/view/{subuser}",
					name: null,
					action: "PterodactylHttpControllersServerSubuserController@update",
				},
				{
					host: null,
					methods: ["DELETE"],
					uri: "server/{server}/users/view/{subuser}",
					name: null,
					action: "PterodactylHttpControllersServerSubuserController@delete",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "server/{server}/schedules",
					name: "server.schedules",
					action:
						"PterodactylHttpControllersServerTasksTaskManagementController@index",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "server/{server}/schedules/new",
					name: "server.schedules.new",
					action:
						"PterodactylHttpControllersServerTasksTaskManagementController@create",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "server/{server}/schedules/new",
					name: null,
					action:
						"PterodactylHttpControllersServerTasksTaskManagementController@store",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "server/{server}/schedules/view/{schedule}",
					name: "server.schedules.view",
					action:
						"PterodactylHttpControllersServerTasksTaskManagementController@view",
				},
				{
					host: null,
					methods: ["PATCH"],
					uri: "server/{server}/schedules/view/{schedule}",
					name: null,
					action:
						"PterodactylHttpControllersServerTasksTaskManagementController@update",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "server/{server}/schedules/view/{schedule}/toggle",
					name: "server.schedules.toggle",
					action:
						"PterodactylHttpControllersServerTasksActionController@toggle",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "server/{server}/schedules/view/{schedule}/trigger",
					name: "server.schedules.trigger",
					action:
						"PterodactylHttpControllersServerTasksActionController@trigger",
				},
				{
					host: null,
					methods: ["DELETE"],
					uri: "server/{server}/schedules/view/{schedule}",
					name: null,
					action:
						"PterodactylHttpControllersServerTasksTaskManagementController@delete",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "api/application/users",
					name: "api.application.users",
					action:
						"PterodactylHttpControllersApiApplicationUsersUserController@index",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "api/application/users/{user}",
					name: "api.application.users.view",
					action:
						"PterodactylHttpControllersApiApplicationUsersUserController@view",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "api/application/users/external/{external_id}",
					name: "api.application.users.external",
					action:
						"PterodactylHttpControllersApiApplicationUsersExternalUserController@index",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "api/application/users",
					name: null,
					action:
						"PterodactylHttpControllersApiApplicationUsersUserController@store",
				},
				{
					host: null,
					methods: ["PATCH"],
					uri: "api/application/users/{user}",
					name: null,
					action:
						"PterodactylHttpControllersApiApplicationUsersUserController@update",
				},
				{
					host: null,
					methods: ["DELETE"],
					uri: "api/application/users/{user}",
					name: null,
					action:
						"PterodactylHttpControllersApiApplicationUsersUserController@delete",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "api/application/nodes",
					name: "api.application.nodes",
					action:
						"PterodactylHttpControllersApiApplicationNodesNodeController@index",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "api/application/nodes/{node}",
					name: "api.application.nodes.view",
					action:
						"PterodactylHttpControllersApiApplicationNodesNodeController@view",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "api/application/nodes",
					name: null,
					action:
						"PterodactylHttpControllersApiApplicationNodesNodeController@store",
				},
				{
					host: null,
					methods: ["PATCH"],
					uri: "api/application/nodes/{node}",
					name: null,
					action:
						"PterodactylHttpControllersApiApplicationNodesNodeController@update",
				},
				{
					host: null,
					methods: ["DELETE"],
					uri: "api/application/nodes/{node}",
					name: null,
					action:
						"PterodactylHttpControllersApiApplicationNodesNodeController@delete",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "api/application/nodes/{node}/allocations",
					name: "api.application.allocations",
					action:
						"PterodactylHttpControllersApiApplicationNodesAllocationController@index",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "api/application/nodes/{node}/allocations",
					name: null,
					action:
						"PterodactylHttpControllersApiApplicationNodesAllocationController@store",
				},
				{
					host: null,
					methods: ["DELETE"],
					uri: "api/application/nodes/{node}/allocations/{allocation}",
					name: "api.application.allocations.view",
					action:
						"PterodactylHttpControllersApiApplicationNodesAllocationController@delete",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "api/application/locations",
					name: "api.applications.locations",
					action:
						"PterodactylHttpControllersApiApplicationLocationsLocationController@index",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "api/application/locations/{location}",
					name: "api.application.locations.view",
					action:
						"PterodactylHttpControllersApiApplicationLocationsLocationController@view",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "api/application/locations",
					name: null,
					action:
						"PterodactylHttpControllersApiApplicationLocationsLocationController@store",
				},
				{
					host: null,
					methods: ["PATCH"],
					uri: "api/application/locations/{location}",
					name: null,
					action:
						"PterodactylHttpControllersApiApplicationLocationsLocationController@update",
				},
				{
					host: null,
					methods: ["DELETE"],
					uri: "api/application/locations/{location}",
					name: null,
					action:
						"PterodactylHttpControllersApiApplicationLocationsLocationController@delete",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "api/application/servers",
					name: "api.application.servers",
					action:
						"PterodactylHttpControllersApiApplicationServersServerController@index",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "api/application/servers/{server}",
					name: "api.application.servers.view",
					action:
						"PterodactylHttpControllersApiApplicationServersServerController@view",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "api/application/servers/external/{external_id}",
					name: "api.application.servers.external",
					action:
						"PterodactylHttpControllersApiApplicationServersExternalServerController@index",
				},
				{
					host: null,
					methods: ["PATCH"],
					uri: "api/application/servers/{server}/details",
					name: "api.application.servers.details",
					action:
						"PterodactylHttpControllersApiApplicationServersServerDetailsController@details",
				},
				{
					host: null,
					methods: ["PATCH"],
					uri: "api/application/servers/{server}/build",
					name: "api.application.servers.build",
					action:
						"PterodactylHttpControllersApiApplicationServersServerDetailsController@build",
				},
				{
					host: null,
					methods: ["PATCH"],
					uri: "api/application/servers/{server}/startup",
					name: "api.application.servers.startup",
					action:
						"PterodactylHttpControllersApiApplicationServersStartupController@index",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "api/application/servers",
					name: null,
					action:
						"PterodactylHttpControllersApiApplicationServersServerController@store",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "api/application/servers/{server}/suspend",
					name: "api.application.servers.suspend",
					action:
						"PterodactylHttpControllersApiApplicationServersServerManagementController@suspend",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "api/application/servers/{server}/unsuspend",
					name: "api.application.servers.unsuspend",
					action:
						"PterodactylHttpControllersApiApplicationServersServerManagementController@unsuspend",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "api/application/servers/{server}/reinstall",
					name: "api.application.servers.reinstall",
					action:
						"PterodactylHttpControllersApiApplicationServersServerManagementController@reinstall",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "api/application/servers/{server}/rebuild",
					name: "api.application.servers.rebuild",
					action:
						"PterodactylHttpControllersApiApplicationServersServerManagementController@rebuild",
				},
				{
					host: null,
					methods: ["DELETE"],
					uri: "api/application/servers/{server}",
					name: null,
					action:
						"PterodactylHttpControllersApiApplicationServersServerController@delete",
				},
				{
					host: null,
					methods: ["DELETE"],
					uri: "api/application/servers/{server}/{force?}",
					name: null,
					action:
						"PterodactylHttpControllersApiApplicationServersServerController@delete",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "api/application/servers/{server}/databases",
					name: "api.application.servers.databases",
					action:
						"PterodactylHttpControllersApiApplicationServersDatabaseController@index",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "api/application/servers/{server}/databases/{database}",
					name: "api.application.servers.databases.view",
					action:
						"PterodactylHttpControllersApiApplicationServersDatabaseController@view",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "api/application/servers/{server}/databases",
					name: null,
					action:
						"PterodactylHttpControllersApiApplicationServersDatabaseController@store",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "api/application/servers/{server}/databases/{database}/reset-password",
					name: null,
					action:
						"PterodactylHttpControllersApiApplicationServersDatabaseController@resetPassword",
				},
				{
					host: null,
					methods: ["DELETE"],
					uri: "api/application/servers/{server}/databases/{database}",
					name: null,
					action:
						"PterodactylHttpControllersApiApplicationServersDatabaseController@delete",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "api/application/nests",
					name: "api.application.nests",
					action:
						"PterodactylHttpControllersApiApplicationNestsNestController@index",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "api/application/nests/{nest}",
					name: "api.application.nests.view",
					action:
						"PterodactylHttpControllersApiApplicationNestsNestController@view",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "api/application/nests/{nest}/eggs",
					name: "api.application.nests.eggs",
					action:
						"PterodactylHttpControllersApiApplicationNestsEggController@index",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "api/application/nests/{nest}/eggs/{egg}",
					name: "api.application.nests.eggs.view",
					action:
						"PterodactylHttpControllersApiApplicationNestsEggController@view",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "api/client",
					name: "api.client.index",
					action: "PterodactylHttpControllersApiClientClientController@index",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "api/client/servers/{server}",
					name: "api.client.servers.view",
					action:
						"PterodactylHttpControllersApiClientServersServerController@index",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "api/client/servers/{server}/utilization",
					name: "api.client.servers.resources",
					action:
						"PterodactylHttpControllersApiClientServersResourceUtilizationController@index",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "api/client/servers/{server}/command",
					name: "api.client.servers.command",
					action:
						"PterodactylHttpControllersApiClientServersCommandController@index",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "api/client/servers/{server}/power",
					name: "api.client.servers.power",
					action:
						"PterodactylHttpControllersApiClientServersPowerController@index",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "api/remote/authenticate/{token}",
					name: "api.remote.authenticate",
					action:
						"PterodactylHttpControllersApiRemoteValidateKeyController@index",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "api/remote/download-file",
					name: "api.remote.download_file",
					action:
						"PterodactylHttpControllersApiRemoteFileDownloadController@index",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "api/remote/eggs",
					name: "api.remote.eggs",
					action:
						"PterodactylHttpControllersApiRemoteEggRetrievalController@index",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "api/remote/eggs/{uuid}",
					name: "api.remote.eggs.download",
					action:
						"PterodactylHttpControllersApiRemoteEggRetrievalController@download",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "api/remote/scripts/{uuid}",
					name: "api.remote.scripts",
					action:
						"PterodactylHttpControllersApiRemoteEggInstallController@index",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "api/remote/sftp",
					name: "api.remote.sftp",
					action: "PterodactylHttpControllersApiRemoteSftpController@index",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "daemon/packs/pull/{uuid}",
					name: "daemon.pack.pull",
					action: "PterodactylHttpControllersDaemonPackController@pull",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "daemon/packs/pull/{uuid}/hash",
					name: "daemon.pack.hash",
					action: "PterodactylHttpControllersDaemonPackController@hash",
				},
				{
					host: null,
					methods: ["GET", "HEAD"],
					uri: "daemon/configure/{token}",
					name: "daemon.configuration",
					action:
						"PterodactylHttpControllersDaemonActionController@configuration",
				},
				{
					host: null,
					methods: ["POST"],
					uri: "daemon/install",
					name: "daemon.install",
					action:
						"PterodactylHttpControllersDaemonActionController@markInstall",
				},
			],
			prefix: "",

			route: function (name, parameters, route) {
				route = route || this.getByName(name);

				if (!route) {
					return undefined;
				}

				return this.toRoute(route, parameters);
			},

			url: function (url, parameters) {
				parameters = parameters || [];

				var uri = url + "/" + parameters.join("/");

				return this.getCorrectUrl(uri);
			},

			toRoute: function (route, parameters) {
				var uri = this.replaceNamedParameters(route.uri, parameters);
				var qs = this.getRouteQueryString(parameters);

				if (this.absolute && this.isOtherHost(route)) {
					return "//" + route.host + "/" + uri + qs;
				}

				return this.getCorrectUrl(uri + qs);
			},

			isOtherHost: (route) =>
				route.host && route.host != window.location.hostname,

			replaceNamedParameters: (uri, parameters) => {
				uri = uri.replace(/\{(.*?)\??\}/g, (match, key) => {
					if (Object.hasOwn(parameters, key)) {
						var value = parameters[key];
						delete parameters[key];
						return value;
					} else {
						return match;
					}
				});

				// Strip out any optional parameters that were not given
				uri = uri.replace(/\/\{.*?\?\}/g, "");

				return uri;
			},

			getRouteQueryString: (parameters) => {
				var qs = [];
				for (var key in parameters) {
					if (Object.hasOwn(parameters, key)) {
						qs.push(key + "=" + parameters[key]);
					}
				}

				if (qs.length < 1) {
					return "";
				}

				return "?" + qs.join("&");
			},

			getByName: function (name) {
				for (var key in this.routes) {
					if (
						Object.hasOwn(this.routes, key) &&
						this.routes[key].name === name
					) {
						return this.routes[key];
					}
				}
			},

			getByAction: function (action) {
				for (var key in this.routes) {
					if (
						Object.hasOwn(this.routes, key) &&
						this.routes[key].action === action
					) {
						return this.routes[key];
					}
				}
			},

			getCorrectUrl: function (uri) {
				var url = this.prefix + "/" + uri.replace(/^\/?/, "");

				if (!this.absolute) {
					return url;
				}

				return this.rootUrl.replace("//?$/", "") + url;
			},
		};

		var getLinkAttributes = (attributes) => {
			if (!attributes) {
				return "";
			}

			var attrs = [];
			for (var key in attributes) {
				if (Object.hasOwn(attributes, key)) {
					attrs.push(key + '="' + attributes[key] + '"');
				}
			}

			return attrs.join(" ");
		};

		var getHtmlLink = (url, title, attributes) => {
			title = title || url;
			attributes = getLinkAttributes(attributes);

			return '<a href="' + url + '" ' + attributes + ">" + title + "</a>";
		};

		return {
			// Generate a url for a given controller action.
			// Router.action('HomeController@getIndex', [params = {}])
			action: (name, parameters) => {
				parameters = parameters || {};

				return routes.route(name, parameters, routes.getByAction(name));
			},

			// Generate a url for a given named route.
			// Router.route('routeName', [params = {}])
			route: (route, parameters) => {
				parameters = parameters || {};

				return routes.route(route, parameters);
			},

			// Generate a fully qualified URL to the given path.
			// Router.route('url', [params = {}])
			url: (route, parameters) => {
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
	}).call(this);

	/**
	 * Expose the class either via AMD, CommonJS or the global object
	 */
	if (typeof define === "function" && define.amd) {
		define(() => laroute);
	} else if (typeof module === "object" && module.exports) {
		module.exports = laroute;
	} else {
		window.Router = laroute;
	}
}).call(this);
