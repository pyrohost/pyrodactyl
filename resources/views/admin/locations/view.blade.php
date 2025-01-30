@extends('layouts.admin')

@section('title')
    Locations &rarr; View &rarr; {{ $location->short }}
@endsection

@section('content-header')
    <h1>{{ $location->short }}<small>{{ str_limit($location->long, 75) }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li><a href="{{ route('admin.locations') }}">Locations</a></li>
        <li class="active">{{ $location->short }}</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-sm-6">
        <div class="box box-primary">
            <div class="box-header with-border">
                <h3 class="box-title">Location Details</h3>
            </div>
            <form action="{{ route('admin.locations.view', $location->id) }}" method="POST">
                <div class="box-body">
                    <div class="form-group">
                        <label for="pShort" class="form-label">Short Code</label>
                        <input type="text" id="pShort" name="short" class="form-control" value="{{ $location->short }}" />
                    </div>
                    <div class="form-group">
                        <label for="pLong" class="form-label">Description</label>
                        <textarea id="pLong" name="long" class="form-control" rows="4">{{ $location->long }}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="pFlagUrl" class="form-label">Flag URL</label>
                        <input type="url" id="pFlagUrl" name="flag_url" class="form-control" value="{{ $location->flag_url }}" />
                    </div>
                    <div class="form-group">
                        <label for="pMaxServers" class="form-label">Maximum Servers</label>
                        <input type="number" id="pMaxServers" name="maximum_servers" class="form-control" value="{{ $location->maximum_servers }}" min="0" />
                    </div>
                    <div class="form-group">
                        <label for="pRequiredRank" class="form-label">Required Rank</label>
                        <input type="number" id="pRequiredRank" name="required_rank" class="form-control" value="{{ $location->required_rank }}" min="0" />
                    </div>
                    <div class="form-group">
                        <label for="pRequiredPlans" class="form-label">Required Plans</label>
                        <select id="pRequiredPlans" name="required_plans[]" class="form-control" multiple>
                            <option value="basic" {{ in_array('basic', $location->required_plans ?? []) ? 'selected' : '' }}>Basic</option>
                            <option value="premium" {{ in_array('premium', $location->required_plans ?? []) ? 'selected' : '' }}>Premium</option>
                            <option value="enterprise" {{ in_array('enterprise', $location->required_plans ?? []) ? 'selected' : '' }}>Enterprise</option>
                        </select>
                    </div>
                </div>
                <div class="box-footer">
                    {!! csrf_field() !!}
                    {!! method_field('PATCH') !!}
                    <button name="action" value="edit" class="btn btn-sm btn-primary pull-right">Save</button>
                    <button name="action" value="delete" class="btn btn-sm btn-danger pull-left muted muted-hover" {{ $location->nodes->count() > 0 ? 'disabled' : '' }}><i class="fa fa-trash-o"></i></button>
                </div>
            </form>
        </div>
    </div>
    <div class="col-sm-6">
        <div class="box">
            <div class="box-header with-border">
                <h3 class="box-title">Nodes</h3>
            </div>
            <div class="box-body table-responsive no-padding">
                <table class="table table-hover">
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>FQDN</th>
                        <th>Servers</th>
                    </tr>
                    @foreach($location->nodes as $node)
                        <tr>
                            <td><code>{{ $node->id }}</code></td>
                            <td><a href="{{ route('admin.nodes.view', $node->id) }}">{{ $node->name }}</a></td>
                            <td><code>{{ $node->fqdn }}</code></td>
                            <td>{{ $node->servers->count() }}</td>
                        </tr>
                    @endforeach
                </table>
            </div>
        </div>
    </div>
</div>
@endsection