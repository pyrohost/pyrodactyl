@extends('layouts.admin')

@section('title')
    Manager User: {{ $user->username }}
@endsection

@section('content-header')
    <h1>{{ $user->name_first }} {{ $user->name_last}}<small>{{ $user->username }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li><a href="{{ route('admin.users') }}">Users</a></li>
        <li class="active">{{ $user->username }}</li>
    </ol>
@endsection

@section('content')
<form action="{{ route('admin.users.view', $user->id) }}" method="POST">
    @csrf
    @method('PATCH')
    
    <div class="row">
        <div class="col-md-6">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">User Identity</h3>
                </div>
                <div class="box-body">
                    <div class="form-group">
                        <label for="username">Username</label>
                        <input type="text" name="username" id="username" class="form-control" value="{{ $user->username }}">
                    </div>
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" name="email" id="email" class="form-control" value="{{ $user->email }}">
                    </div>
                    <div class="form-group">
                        <label for="name_first">First Name</label>
                        <input type="text" name="name_first" id="name_first" class="form-control" value="{{ $user->name_first }}">
                    </div>
                    <div class="form-group">
                        <label for="name_last">Last Name</label>
                        <input type="text" name="name_last" id="name_last" class="form-control" value="{{ $user->name_last }}">
                    </div>
                    <div class="form-group">
                        <label for="password">Password (optional)</label>
                        <input type="password" name="password" id="password" class="form-control">
                    </div>
                    <div class="form-group">
                        <label for="password_confirmation">Confirm Password</label>
                        <input type="password" name="password_confirmation" id="password_confirmation" class="form-control">
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="root_admin" {{ $user->root_admin ? 'checked' : '' }}>
                            Administrator Account
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-md-6">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">Resources & Limits</h3>
                </div>
                <div class="box-body">
                    <div class="row">
                        <div class="col-md-6">
                            <h4>Current Resources</h4>
                            @foreach(['cpu', 'memory', 'disk', 'allocations', 'backups', 'servers'] as $resource)
                                <div class="form-group">
                                    <label>{{ ucfirst($resource) }}</label>
                                    <input type="number" 
                                           name="resources[{{ $resource }}]" 
                                           class="form-control"
                                           step="{{ $resource === 'cpu' ? '0.1' : '1' }}"
                                           value="{{ $user->resources[$resource] ?? 0 }}">
                                </div>
                            @endforeach
                        </div>
                        <div class="col-md-6">
                            <h4>Resource Limits</h4>
                            @foreach(['cpu', 'memory', 'disk', 'allocations', 'backups', 'servers'] as $limit)
                                <div class="form-group">
                                    <label>{{ ucfirst($limit) }} Limit</label>
                                    <input type="number" 
                                           name="limits[{{ $limit }}]" 
                                           class="form-control"
                                           step="{{ $limit === 'cpu' ? '0.1' : '1' }}"
                                           value="{{ $user->limits[$limit] ?? 0 }}">
                                </div>
                            @endforeach
                        </div>
                    </div>
                </div>
            </div>

            <div class="box box-danger">
                <div class="box-header with-border">
                    <h3 class="box-title">Danger Zone</h3>
                </div>
                <div class="box-body">
                    <button type="button" class="btn btn-danger" data-toggle="modal" data-target="#deleteModal">
                        Delete User
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-md-12">
            <div class="box-footer text-right">
                <button type="submit" class="btn btn-primary">Save Changes</button>
            </div>
        </div>
    </div>
</form>

<!-- Delete Modal -->
<div class="modal fade" id="deleteModal" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
                <h4 class="modal-title">Delete User</h4>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to delete this user? This action cannot be undone.</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                <form action="{{ route('admin.users.view', $user->id) }}" method="POST" style="display: inline;">
                    @csrf
                    @method('DELETE')
                    <button type="submit" class="btn btn-danger">Delete</button>
                </form>
            </div>
        </div>
    </div>
</div>
@endsection

