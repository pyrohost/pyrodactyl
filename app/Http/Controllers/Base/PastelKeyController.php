<?php

namespace Pterodactyl\Http\Controllers\Base;

use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Models\PastelKey;
use Illuminate\Http\Request;
use Pterodactyl\Models\AdminAcl;

class PastelKeyController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'memo' => 'nullable|string',
            'allowed_ips' => 'nullable|array',
            'expires_at' => 'nullable|date',
            'permissions' => 'required|array'
        ]);

        $key = new PastelKey();
        $keyPair = PastelKey::generateKey();
        
        $key->user_id = $request->user()->id;
        $key->identifier = $keyPair['identifier'];
        $key->token = $keyPair['secret'];
        $key->memo = $validated['memo'];
        $key->allowed_ips = $validated['allowed_ips'];
        $key->expires_at = $validated['expires_at'];

        foreach ($validated['permissions'] as $resource => $permission) {
            $key->setPermission($resource, $permission);
        }

        $key->save();

        return response()->json([
            'key' => $key->identifier . '.' . $key->token
        ], 201);
    }

    public function index(Request $request)
    {
        return response()->json([
            'keys' => PastelKey::where('user_id', $request->user()->id)->get()
        ]);
    }

    public function destroy(PastelKey $key)
    {
        $key->delete();
        return response()->noContent();
    }

    public function generateDemoKey()
    {
        $key = new PastelKey();
        $key->user_id = 1; // Admin user ID
        $key->identifier = str_random(16);
        $key->token = encrypt(str_random(32));
        $key->memo = 'Demo Key';
        
        // Set all permissions to full access
        $key->r_users = 3; // READ + WRITE
        $key->r_servers = 3;
        $key->r_nodes = 3;
        $key->r_allocations = 3;
        $key->r_nests = 3;
        $key->r_eggs = 3;
        $key->r_locations = 3;
        $key->r_database_hosts = 3;
        $key->r_server_databases = 3;

        $key->save();

        return response()->json([
            'key' => $key->identifier,
            'message' => 'Demo key generated successfully'
        ]);
    }
}