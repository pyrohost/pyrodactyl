@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'advanced'])

@section('title')
  Advanced Settings
@endsection

@section('content-header')
  <h1>Advanced Settings<small>Configure advanced settings for Pterodactyl.</small></h1>
  <ol class="breadcrumb">
    <li><a href="{{ route('admin.index') }}">Admin</a></li>
    <li class="active">Settings</li>
  </ol>
@endsection

@section('content')
  @yield('settings::nav')
  <div class="row">
    <div class="col-xs-12">
    <form action="" method="POST">
      <div class="box">
      <div class="box-header with-border">
        <h3 class="box-title">HTTP Connections</h3>
      </div>
      <div class="box-body">
        <div class="row">
        <div class="form-group col-md-6">
          <label class="control-label">Connection Timeout</label>
          <div>
          <input type="number" required class="form-control" name="pterodactyl:guzzle:connect_timeout"
            value="{{ old('pterodactyl:guzzle:connect_timeout', config('pterodactyl.guzzle.connect_timeout')) }}">
          <p class="text-muted small">The amount of time in seconds to wait for a connection to be opened before
            throwing an error.</p>
          </div>
        </div>
        <div class="form-group col-md-6">
          <label class="control-label">Request Timeout</label>
          <div>
          <input type="number" required class="form-control" name="pterodactyl:guzzle:timeout"
            value="{{ old('pterodactyl:guzzle:timeout', config('pterodactyl.guzzle.timeout')) }}">
          <p class="text-muted small">The amount of time in seconds to wait for a request to be completed before
            throwing an error.</p>
          </div>
        </div>
        </div>
      </div>
      </div>
      <div class="box">
      <div class="box-header with-border">
        <h3 class="box-title">Automatic Allocation Creation</h3>
      </div>
      <div class="box-body">
        <div class="row">
        <div class="form-group col-md-4">
          <label class="control-label">Status</label>
          <div>
          <select class="form-control" name="pterodactyl:client_features:allocations:enabled">
            <option value="false">Disabled</option>
            <option value="true" @if(old('pterodactyl:client_features:allocations:enabled', config('pterodactyl.client_features.allocations.enabled'))) selected @endif>Enabled</option>
          </select>
          <p class="text-muted small">If enabled users will have the option to automatically create new
            allocations for their server via the frontend.</p>
          </div>
        </div>
        <div class="form-group col-md-4">
          <label class="control-label">Starting Port</label>
          <div>
          <input type="number" class="form-control" name="pterodactyl:client_features:allocations:range_start"
            value="{{ old('pterodactyl:client_features:allocations:range_start', config('pterodactyl.client_features.allocations.range_start')) }}">
          <p class="text-muted small">The starting port in the range that can be automatically allocated.</p>
          </div>
        </div>
        <div class="form-group col-md-4">
          <label class="control-label">Ending Port</label>
          <div>
          <input type="number" class="form-control" name="pterodactyl:client_features:allocations:range_end"
            value="{{ old('pterodactyl:client_features:allocations:range_end', config('pterodactyl.client_features.allocations.range_end')) }}">
          <p class="text-muted small">The ending port in the range that can be automatically allocated.</p>
          </div>
        </div>
        </div>
      </div>
      </div>
      <div class="box box-primary">
      <div class="box-footer">
        {{ csrf_field() }}
        <button type="submit" name="_method" value="PATCH" class="btn btn-sm btn-primary pull-right">Save</button>
      </div>
      </div>
    </form>
    </div>
  </div>
@endsection