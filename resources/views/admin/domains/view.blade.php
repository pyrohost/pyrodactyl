@extends('layouts.admin')

@section('title')
    Domains &rarr; View &rarr; {{ $domain->name }}
@endsection

@section('content-header')
    <h1>{{ $domain->name }}<small>{{ $domain->description ?? 'Domain management' }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li><a href="{{ route('admin.domains') }}">Domains</a></li>
        <li class="active">{{ $domain->name }}</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-md-6">
        <div class="box box-primary">
            <div class="box-header with-border">
                <h3 class="box-title">Domain Details</h3>
            </div>
            <form action="{{ route('admin.domains.view', $domain->id) }}" method="POST" id="domainEditForm">
                <div class="box-body">
                    <div class="form-group">
                        <label for="domainName" class="form-label">Domain Name</label>
                        <input type="text" id="domainName" name="name" class="form-control" value="{{ $domain->name }}" />
                        <p class="text-muted small">The domain name used for subdomains.</p>
                    </div>
                    <div class="form-group">
                        <label for="dnsProvider" class="form-label">DNS Provider</label>
                        <select id="dnsProvider" name="dns_provider" class="form-control">
                            @foreach($providers as $key => $provider)
                                <option value="{{ $key }}" {{ $domain->dns_provider === $key ? 'selected' : '' }}>
                                    {{ $provider['name'] }}
                                </option>
                            @endforeach
                        </select>
                    </div>
                    @if($domain->dns_provider === 'cloudflare')
                        <div class="form-group">
                            <label for="apiToken">API Token</label>
                            <input type="password" name="dns_config[api_token]" id="apiToken"
                                   class="form-control" value="{{ $domain->dns_config['api_token'] ?? '' }}" />
                        </div>
                        <div class="form-group">
                            <label for="zoneId">Zone ID</label>
                            <input type="text" name="dns_config[zone_id]" id="zoneId"
                                   class="form-control" value="{{ $domain->dns_config['zone_id'] ?? '' }}" />
                        </div>
                    @endif
                    </div>

                    <div class="form-group">
                        <div class="checkbox">
                            <label style="color: #333; font-weight: normal;">
                                <input type="checkbox" name="is_active" value="1" {{ $domain->is_active ? 'checked' : '' }}>
                                Active
                            </label>
                            <p class="text-muted small">Whether this domain can be used for new subdomains.</p>
                        </div>
                    </div>
                </div>
                <div class="box-footer">
                    {!! csrf_field() !!}
                    {!! method_field('PATCH') !!}
                    <button name="action" value="edit" class="btn btn-sm btn-primary pull-right">Save Changes</button>
                    <button name="action" value="delete" class="btn btn-sm btn-danger pull-left muted muted-hover">
                        <i class="fa fa-trash-o"></i> Delete
                    </button>
                </div>
            </form>
        </div>
    </div>
    
    <div class="col-md-6">
        <div class="box box-default">
            <div class="box-header with-border">
                <h3 class="box-title">DNS Status</h3>
                <div class="box-tools">
                    <span class="label label-success">Connected</span>
                </div>
            </div>
            <div class="box-body">
                @php
                    $syncStatus = $domain->sync_status['status'] ?? 'unknown';
                    $syncColor = match($syncStatus) {
                        'success' => 'success',
                        'error' => 'danger',
                        'partial' => 'warning',
                        default => 'default'
                    };
                @endphp
                <div class="callout callout-{{ $syncColor }}">
                    <h4>
                        <i class="fa fa-{{ $syncStatus === 'success' ? 'check' : ($syncStatus === 'error' ? 'times' : 'exclamation-triangle') }}"></i>
                        Status: {{ ucfirst($syncStatus) }}
                    </h4>
                    <p>{{ $domain->sync_status['message'] ?? 'No sync information available' }}</p>
                    @if($domain->last_sync_at)
                        <p><small>Last sync: {{ $domain->last_sync_at->format('Y-m-d H:i:s') }}</small></p>
                    @endif
                </div>
                
                <div class="info-box">
                    <span class="info-box-icon bg-{{ $domain->is_active ? 'green' : 'red' }}">
                        <i class="fa fa-{{ $domain->is_active ? 'check' : 'times' }}"></i>
                    </span>
                    <div class="info-box-content">
                        <span class="info-box-text" style="color: #333;">Domain Status</span>
                        <span class="info-box-number" style="color: #333;">{{ $domain->is_active ? 'Active' : 'Inactive' }}</span>
                    </div>
                </div>

                <div class="info-box">
                    <span class="info-box-icon bg-blue">
                        <i class="fa fa-server"></i>
                    </span>
                    <div class="info-box-content">
                        <span class="info-box-text" style="color: #333;">Servers Using Domain</span>
                        <span class="info-box-number" style="color: #333;">{{ $domain->servers->count() }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Servers using this domain -->
@if($domain->servers->count() > 0)
<div class="row">
    <div class="col-xs-12">
        <div class="box">
            <div class="box-header with-border">
                <h3 class="box-title">Servers Using This Domain</h3>
            </div>
            <div class="box-body table-responsive no-padding">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Server ID</th>
                            <th>Server Name</th>
                            <th>Subdomain</th>
                            <th>Type</th>
                            <th>Full Domain</th>
                            <th>Owner</th>
                            <th>Node</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($domain->servers as $server)
                            <tr>
                                <td><code>{{ $server->id }}</code></td>
                                <td>
                                    <a href="{{ route('admin.servers.view', $server->id) }}">{{ $server->name }}</a>
                                </td>
                                <td>
                                    @if($server->subdomain)
                                        <code>{{ $server->subdomain }}</code>
                                    @else
                                        <span class="text-muted">No subdomain</span>
                                    @endif
                                </td>
                                <td>
                                    @if($server->subdomain_type)
                                        <span class="label label-info">{{ $server->subdomain_type }}</span>
                                    @else
                                        <span class="text-muted">-</span>
                                    @endif
                                </td>
                                <td>
                                    @if($server->getFullDomainName())
                                        <a href="http://{{ $server->getFullDomainName() }}" target="_blank">
                                            {{ $server->getFullDomainName() }}
                                        </a>
                                    @else
                                        <span class="text-muted">-</span>
                                    @endif
                                </td>
                                <td>
                                    <a href="{{ route('admin.users.view', $server->user->id) }}">{{ $server->user->email }}</a>
                                </td>
                                <td>
                                    <a href="{{ route('admin.nodes.view', $server->node->id) }}">{{ $server->node->name }}</a>
                                </td>
                                <td>
                                    @if($server->subdomain)
                                        <a href="{{ route('admin.servers.view', $server->id) }}" class="btn btn-xs btn-primary">
                                            <i class="fa fa-eye"></i> View Server
                                        </a>
                                    @endif
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
@endif
@endsection

@section('footer-scripts')
@parent
<script>
// Simple confirmation for delete action
document.addEventListener('DOMContentLoaded', function() {
    const deleteButton = document.querySelector('button[name="action"][value="delete"]');
    if (deleteButton) {
        deleteButton.addEventListener('click', function(e) {
            @if($domain->servers->count() > 0)
                e.preventDefault();
                alert('Cannot delete this domain. It is currently being used by {{ $domain->servers->count() }} server(s). Remove all subdomains first.');
                return false;
            @else
                if (!confirm('Are you sure you want to delete this domain? This action cannot be undone.')) {
                    e.preventDefault();
                    return false;
                }
            @endif
        });
    }
});
</script>
@endsection