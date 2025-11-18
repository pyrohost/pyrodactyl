@extends('layouts.admin')

@section('title')
    Admin Permissions: {{ $user->username }}
@endsection

@section('content-header')
    <h1>{{ $user->name_first }} {{ $user->name_last}}<small>Admin Permissions</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li><a href="{{ route('admin.users') }}">Users</a></li>
        <li><a href="{{ route('admin.users.view', $user->id) }}">{{ $user->username }}</a></li>
        <li class="active">Permissions</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-md-12">
        @if($user->root_admin)
        <div class="alert alert-info">
            <strong>Root Administrator:</strong> This user has full administrative access to all features. 
            Individual permissions below are informational only and do not restrict access.
        </div>
        @endif
        
        <form action="{{ route('admin.users.permissions.update', $user->id) }}" method="post">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">Administrative Permissions</h3>
                </div>
                <div class="box-body">
                    <p class="text-muted">
                        Select the administrative permissions this user should have. 
                        @if(!$user->root_admin)
                        Users with admin permissions can access the admin panel but only perform actions they have been granted permission for.
                        @endif
                    </p>
                    <hr>
                    
                    @foreach($permissions as $categoryKey => $category)
                    <div class="permission-category">
                        <h4>{{ $category['name'] }}</h4>
                        <div class="row">
                            @foreach($category['permissions'] as $permKey => $permName)
                            <div class="col-md-6">
                                <div class="checkbox">
                                    <label>
                                        <input 
                                            type="checkbox" 
                                            name="permissions[]" 
                                            value="{{ $permKey }}"
                                            {{ in_array($permKey, $userPermissions) ? 'checked' : '' }}
                                            {{ $user->root_admin ? 'disabled' : '' }}
                                        >
                                        {{ $permName }}
                                    </label>
                                </div>
                            </div>
                            @endforeach
                        </div>
                        <hr>
                    </div>
                    @endforeach
                    
                    @if($user->root_admin)
                    <div class="alert alert-warning">
                        <strong>Note:</strong> To modify permissions, first remove root admin status from this user on the 
                        <a href="{{ route('admin.users.view', $user->id) }}">user details page</a>.
                    </div>
                    @endif
                </div>
                <div class="box-footer">
                    {!! csrf_field() !!}
                    {!! method_field('PATCH') !!}
                    @if(!$user->root_admin)
                    <button type="submit" class="btn btn-primary btn-sm">Update Permissions</button>
                    @endif
                    <a href="{{ route('admin.users.view', $user->id) }}" class="btn btn-default btn-sm">Back to User</a>
                </div>
            </div>
        </form>
    </div>
</div>

@section('footer-scripts')
    @parent
    <style>
        .permission-category {
            margin-bottom: 20px;
        }
        .permission-category h4 {
            color: #333;
            font-weight: 600;
            margin-bottom: 15px;
        }
        .permission-category .checkbox {
            margin-top: 5px;
            margin-bottom: 5px;
        }
        .permission-category hr:last-child {
            margin-top: 20px;
        }
    </style>
    
    <script>
        // Add "Select All" functionality if needed
        $(document).ready(function() {
            // You can add JavaScript for bulk selection here if desired
        });
    </script>
@endsection
@endsection
