@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'domains'])

@section('title')
  Domain Management
@endsection

@section('content-header')
  <h1>Domain Management<small>Configure DNS domains for subdomain management.</small></h1>
  <ol class="breadcrumb">
    <li><a href="{{ route('admin.index') }}">Admin</a></li>
    <li><a href="{{ route('admin.settings') }}">Settings</a></li>
    <li class="active">Domains</li>
  </ol>
@endsection

@section('content')
  @yield('settings::nav')
  <div class="row">
    <div class="col-xs-12">
      <div class="box">
        <div class="box-header with-border">
          <h3 class="box-title">Configured Domains</h3>
          <div class="box-tools">
            <a href="{{ route('admin.settings.domains.create') }}" class="btn btn-sm btn-primary">Create New Domain</a>
          </div>
        </div>
        <div class="box-body table-responsive no-padding">
          @if(count($domains) > 0)
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Domain Name</th>
                  <th>DNS Provider</th>
                  <th>Status</th>
                  <th>Default</th>
                  <th>Subdomains</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @foreach($domains as $domain)
                  <tr>
                    <td><code>{{ $domain->name }}</code></td>
                    <td>
                      <span class="label label-primary">{{ ucfirst($domain->dns_provider) }}</span>
                    </td>
                    <td>
                      @if($domain->is_active)
                        <span class="label label-success">Active</span>
                      @else
                        <span class="label label-danger">Inactive</span>
                      @endif
                    </td>
                    <td>
                      @if($domain->is_default)
                        <span class="label label-info">Default</span>
                      @endif
                    </td>
                    <td>
                      <span class="label label-default">{{ $domain->server_subdomains_count ?? 0 }}</span>
                    </td>
                    <td>{{ $domain->created_at->diffForHumans() }}</td>
                    <td class="text-center">
                      <a href="{{ route('admin.settings.domains.edit', $domain) }}" class="btn btn-xs btn-primary">Edit</a>
                      @if($domain->server_subdomains_count == 0)
                        <form action="{{ route('admin.settings.domains.destroy', $domain) }}" method="POST" style="display: inline;" onsubmit="return confirm('Are you sure you want to delete this domain?')">
                          @csrf
                          @method('DELETE')
                          <button type="submit" class="btn btn-xs btn-danger">Delete</button>
                        </form>
                      @endif
                    </td>
                  </tr>
                @endforeach
              </tbody>
            </table>
          @else
            <div class="text-center" style="padding: 50px;">
              <h4 class="text-muted">No domains configured</h4>
              <p class="text-muted">
                Configure DNS domains to enable subdomain management for servers.<br>
                <a href="{{ route('admin.settings.domains.create') }}" class="btn btn-primary btn-sm" style="margin-top: 10px;">Create Your First Domain</a>
              </p>
            </div>
          @endif
        </div>
      </div>
    </div>
  </div>
@endsection

@section('footer-scripts')
  @parent
  <script>
    $(document).ready(function() {
      $('.btn-danger').click(function(e) {
        if (!confirm('Are you sure you want to delete this domain? This action cannot be undone.')) {
          e.preventDefault();
          return false;
        }
      });
    });
  </script>
@endsection