@extends('layouts.admin')

@section('title')
    Domains
@endsection

@section('content-header')
    <h1>Domains<small>Manage DNS domains for server subdomain allocation.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li class="active">Domains</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-xs-12">
        <div class="box box-primary">
            <div class="box-header with-border">
                <h3 class="box-title">Domain List</h3>
                <div class="box-tools">
                    <button class="btn btn-sm btn-primary" data-toggle="modal" data-target="#newDomainModal">Create New</button>
                </div>
            </div>
            <div class="box-body table-responsive no-padding">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Domain Name</th>
                            <th>DNS Provider</th>
                            <th class="text-center">Status</th>
                            <th class="text-center">Servers</th>
                            <th class="text-center">Last Sync</th>
                            <th class="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($domains as $domain)
                            @php
                                $statusColor = $domain->is_active ? '#50af51' : '#d9534f';
                                $syncStatus = $domain->sync_status['status'] ?? 'unknown';
                                $syncColor = match($syncStatus) {
                                    'success' => '#50af51',
                                    'error' => '#d9534f',
                                    'partial' => '#e0a800',
                                    default => '#777'
                                };
                            @endphp
                            <tr>
                                <td><code>{{ $domain->id }}</code></td>
                                <td>
                                    <a href="{{ route('admin.domains.view', $domain->id) }}">{{ $domain->name }}</a>
                                    @if($domain->description)
                                        <br><small class="text-muted">{{ $domain->description }}</small>
                                    @endif
                                </td>
                                <td>
                                    <span class="label label-default">{{ $domain->getProviderDisplayName() }}</span>
                                </td>
                                <td class="text-center">
                                    <span class="label" style="background-color: {{ $statusColor }}">
                                        {{ $domain->is_active ? 'Active' : 'Inactive' }}
                                    </span>
                                </td>
                                <td class="text-center">{{ $domain->servers_count ?? 0 }}</td>
                                <td class="text-center">
                                    @if($domain->last_sync_at)
                                        <span style="color: {{ $syncColor }}" title="{{ $domain->sync_status['message'] ?? '' }}">
                                            {{ $domain->last_sync_at->diffForHumans() }}
                                        </span>
                                    @else
                                        <span class="text-muted">Never</span>
                                    @endif
                                </td>
                                <td class="text-center">
                                    <a href="{{ route('admin.domains.view', $domain->id) }}" class="btn btn-xs btn-primary">
                                        <i class="fa fa-eye"></i> View
                                    </a>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="7" class="text-center text-muted">No domains configured. Click "Create New" to add your first domain.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<!-- New Domain Modal -->
<div class="modal fade" id="newDomainModal" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
            <form action="{{ route('admin.domains') }}" method="POST" id="domainForm">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                    <h4 class="modal-title">Create Domain</h4>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-md-6">
                            <label for="domainName" class="form-label">Domain Name</label>
                            <input type="text" name="name" id="domainName" class="form-control" placeholder="example.com" required />
                            <p class="text-muted small">The domain name that will be used for subdomains (e.g., example.com).</p>
                        </div>
                        <div class="col-md-6">
                            <label for="domainProvider" class="form-label">DNS Provider</label>
                            <select name="dns_provider" id="domainProvider" class="form-control" required>
                                <option value="">Select Provider</option>
                                @foreach($providers as $key => $provider)
                                    <option value="{{ $key }}">{{ $provider['name'] }}</option>
                                @endforeach
                            </select>
                        </div>
                    </div>
                    
                    <!-- DNS Provider Configuration -->
                    <div id="providerConfig" style="display: none;">
                        <hr>
                        <div id="configFields"></div>
                    </div>

                    <div class="form-group">
                        <div class="checkbox">
                            <label style="color: #333; font-weight: normal;">
                                <input type="checkbox" name="is_active" value="1" checked>
                                Active
                            </label>
                            <p class="text-muted small">Whether this domain can be used for new subdomains.</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    {!! csrf_field() !!}
                    <button type="button" class="btn btn-default btn-sm pull-left" data-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-success btn-sm">Create</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection

@section('footer-scripts')
@parent
<script>
// Handle provider selection to show config fields
document.getElementById('domainProvider').addEventListener('change', function() {
    const provider = this.value;
    const configSection = document.getElementById('providerConfig');
    const configFields = document.getElementById('configFields');
    
    if (provider === 'cloudflare') {
        configFields.innerHTML = `
            <div class="form-group">
                <label for="config_api_token">API Token</label>
                <input type="password" name="dns_config[api_token]" id="config_api_token" class="form-control" required />
                <p class="text-muted small">Cloudflare API token with Zone:Edit permissions</p>
            </div>
            <div class="form-group">
                <label for="config_zone_id">Zone ID</label>
                <input type="text" name="dns_config[zone_id]" id="config_zone_id" class="form-control" required />
                <p class="text-muted small">The Zone ID for your domain in Cloudflare</p>
            </div>
        `;
        configSection.style.display = 'block';
    } else {
        configSection.style.display = 'none';
    }
});
</script>
@endsection