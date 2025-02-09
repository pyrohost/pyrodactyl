@extends('layouts.admin')

@section('title')
    Locations
@endsection

@section('content-header')
    <h1>Locations<small>All locations that nodes can be assigned to for easier categorization.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li class="active">Locations</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-xs-12">
        <div class="box box-primary">
            <div class="box-header with-border">
                <h3 class="box-title">Location List</h3>
                <div class="box-tools">
                    <button class="btn btn-sm btn-primary" data-toggle="modal" data-target="#newLocationModal">Create New</button>
                </div>
            </div>
            <div class="box-body table-responsive no-padding">
                <table class="table table-hover">
                    <tbody>
                        <tr>
                            <th>ID</th>
                            <th>Short Code</th>
                            <th>Description</th>
                            <th class="text-center">Nodes</th>
                            <th class="text-center">Servers</th>
                        </tr>
                        @foreach ($locations as $location)
                            <tr>
                                <td><code>{{ $location->id }}</code></td>
                                <td><a href="{{ route('admin.locations.view', $location->id) }}">{{ $location->short }}</a></td>
                                <td>{{ $location->long }}</td>
                                <td class="text-center">{{ $location->nodes_count }}</td>
                                <td class="text-center">{{ $location->servers_count }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
<div class="modal fade" id="newLocationModal" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <form action="{{ route('admin.locations') }}" method="POST">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                    <h4 class="modal-title">Create Location</h4>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-md-12">
                            <label for="pShortModal" class="form-label">Short Code</label>
                            <input type="text" name="short" id="pShortModal" class="form-control" />
                            <p class="text-muted small">A short identifier used to distinguish this location from others. Must be between 1 and 60 characters.</p>
                        </div>
                        <div class="col-md-12">
                            <label for="pLongModal" class="form-label">Description</label>
                            <textarea name="long" id="pLongModal" class="form-control" rows="4"></textarea>
                            <p class="text-muted small">A longer description of this location. Must be less than 191 characters.</p>
                        </div>
                        <div class="col-md-12">
                            <label for="pFlagUrlModal" class="form-label">Flag URL</label>
                            <input type="url" name="flag_url" id="pFlagUrlModal" class="form-control" />
                            <p class="text-muted small">A valid URL to an image file representing this location's flag.</p>
                        </div>
                        <div class="col-md-6">
                            <label for="pMaxServersModal" class="form-label">Maximum Servers</label>
                            <input type="number" name="maximum_servers" id="pMaxServersModal" class="form-control" value="0" min="0" />
                            <p class="text-muted small">Maximum number of servers allowed (0 for unlimited).</p>
                        </div>
                        <div class="col-md-12">
    <label>Required Ranks</label>
    <div class="form-group">
        <div class="checkbox-inline">
            <label class="mr-4">
                <input type="checkbox" name="required_rank[]" value="free"> Free
            </label>
            <label class="mr-4">
                <input type="checkbox" name="required_rank[]" value="premium"> Premium
            </label>
            <label>
                <input type="checkbox" name="required_rank[]" value="staff"> Staff
            </label>
        </div>
    </div>
    <p class="text-muted small">Select ranks that can access this location.</p>
</div>


                        <div class="col-md-12">
                            <div class="col-md-12">
                                <label for="required_plans">Required Plans</label>
                                <select name="required_plans[]" id="required_plans" class="form-control" multiple>
                                    @foreach($plans as $plan)
                                        <option value="{{ $plan->name }}">
                                            {{ $plan->name }} ({{ $plan->memory }}MB RAM, {{ $plan->cpu }}% CPU)
                                        </option>
                                    @endforeach
                                </select>
                                <p class="text-muted small">Select plans that have access to this location (none for all plans).</p>
                            </div>
                            
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    {!! csrf_field() !!}
                    <button type="button" class="btn btn-default pull-left" data-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create</button>
                </div>
            </form>
        </div>
    </div>
</div>
</div>

@endsection