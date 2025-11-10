@extends('layouts.admin')

@section('title')
  {{ $node->name }} - Transfers
@endsection

@section('content-header')
  <h1>{{ $node->name }}<small>Server transfers for this node.</small></h1>
  <ol class="breadcrumb">
    <li><a href="{{ route('admin.index') }}">Admin</a></li>
    <li><a href="{{ route('admin.nodes') }}">Nodes</a></li>
    <li><a href="{{ route('admin.nodes.view', $node->id) }}">{{ $node->name }}</a></li>
    <li class="active">Transfers</li>
  </ol>
@endsection

@section('content')
  <div class="row">
    <div class="col-xs-12">
      <div class="nav-tabs-custom nav-tabs-floating">
        <ul class="nav nav-tabs">
          <li><a href="{{ route('admin.nodes.view', $node->id) }}">About</a></li>
          <li><a href="{{ route('admin.nodes.view.settings', $node->id) }}">Settings</a></li>
          <li><a href="{{ route('admin.nodes.view.configuration', $node->id) }}">Configuration</a></li>
          <li><a href="{{ route('admin.nodes.view.allocation', $node->id) }}">Allocation</a></li>
          <li><a href="{{ route('admin.nodes.view.servers', $node->id) }}">Servers</a></li>
          <li class="active"><a href="{{ route('admin.nodes.view.transfers', $node->id) }}">Transfers</a></li>
        </ul>
      </div>
    </div>
  </div>

  <div class="row">
    <div class="col-xs-12">
      <div class="box box-primary">
        <div class="box-header with-border">
          <h3 class="box-title">Outgoing Transfers</h3>
          <div class="box-tools">
            <span class="label label-primary">{{ $node->max_concurrent_outgoing_transfers }} concurrent max</span>
          </div>
        </div>
        <div class="box-body table-responsive no-padding">
          @if($outgoing->count() > 0)
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Server</th>
                  <th>Destination</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Queued</th>
                  <th>Activated</th>
                  <th>Last Heartbeat</th>
                </tr>
              </thead>
              <tbody>
                @foreach($outgoing as $transfer)
                  <tr>
                    <td>
                      <a href="{{ route('admin.servers.view', $transfer->server->id) }}">{{ $transfer->server->name }}</a>
                      <br><small class="text-muted">{{ $transfer->server->uuid }}</small>
                    </td>
                    <td>
                      <a href="{{ route('admin.nodes.view', $transfer->newNode->id) }}">{{ $transfer->newNode->name }}</a>
                    </td>
                    <td>
                      @if($transfer->queue_status === 'active')
                        <span class="label label-success">Active</span>
                      @elseif($transfer->queue_status === 'queued')
                        <span class="label label-warning">Queued</span>
                      @elseif($transfer->queue_status === 'failed')
                        <span class="label label-danger">Failed</span>
                      @else
                        <span class="label label-default">{{ ucfirst($transfer->queue_status) }}</span>
                      @endif
                    </td>
                    <td>{{ $transfer->priority }}</td>
                    <td>
                      @if($transfer->queued_at)
                        <span title="{{ $transfer->queued_at }}">{{ $transfer->queued_at->diffForHumans() }}</span>
                      @else
                        <span class="text-muted">-</span>
                      @endif
                    </td>
                    <td>
                      @if($transfer->activated_at)
                        <span title="{{ $transfer->activated_at }}">{{ $transfer->activated_at->diffForHumans() }}</span>
                      @else
                        <span class="text-muted">-</span>
                      @endif
                    </td>
                    <td>
                      @if($transfer->last_heartbeat_at)
                        <span title="{{ $transfer->last_heartbeat_at }}">{{ $transfer->last_heartbeat_at->diffForHumans() }}</span>
                      @else
                        <span class="text-muted">-</span>
                      @endif
                    </td>
                  </tr>
                @endforeach
              </tbody>
            </table>
          @else
            <div class="box-body">
              <p class="text-muted text-center">No outgoing transfers for this node.</p>
            </div>
          @endif
        </div>
        @if($outgoing->hasPages())
          <div class="box-footer">
            {{ $outgoing->appends(['incoming' => request()->get('incoming')])->links() }}
          </div>
        @endif
      </div>
    </div>
  </div>

  <div class="row">
    <div class="col-xs-12">
      <div class="box box-success">
        <div class="box-header with-border">
          <h3 class="box-title">Incoming Transfers</h3>
          <div class="box-tools">
            <span class="label label-success">{{ $node->max_concurrent_incoming_transfers }} concurrent max</span>
          </div>
        </div>
        <div class="box-body table-responsive no-padding">
          @if($incoming->count() > 0)
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Server</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Queued</th>
                  <th>Activated</th>
                  <th>Last Heartbeat</th>
                </tr>
              </thead>
              <tbody>
                @foreach($incoming as $transfer)
                  <tr>
                    <td>
                      <a href="{{ route('admin.servers.view', $transfer->server->id) }}">{{ $transfer->server->name }}</a>
                      <br><small class="text-muted">{{ $transfer->server->uuid }}</small>
                    </td>
                    <td>
                      <a href="{{ route('admin.nodes.view', $transfer->oldNode->id) }}">{{ $transfer->oldNode->name }}</a>
                    </td>
                    <td>
                      @if($transfer->queue_status === 'active')
                        <span class="label label-success">Active</span>
                      @elseif($transfer->queue_status === 'queued')
                        <span class="label label-warning">Queued</span>
                      @elseif($transfer->queue_status === 'failed')
                        <span class="label label-danger">Failed</span>
                      @else
                        <span class="label label-default">{{ ucfirst($transfer->queue_status) }}</span>
                      @endif
                    </td>
                    <td>{{ $transfer->priority }}</td>
                    <td>
                      @if($transfer->queued_at)
                        <span title="{{ $transfer->queued_at }}">{{ $transfer->queued_at->diffForHumans() }}</span>
                      @else
                        <span class="text-muted">-</span>
                      @endif
                    </td>
                    <td>
                      @if($transfer->activated_at)
                        <span title="{{ $transfer->activated_at }}">{{ $transfer->activated_at->diffForHumans() }}</span>
                      @else
                        <span class="text-muted">-</span>
                      @endif
                    </td>
                    <td>
                      @if($transfer->last_heartbeat_at)
                        <span title="{{ $transfer->last_heartbeat_at }}">{{ $transfer->last_heartbeat_at->diffForHumans() }}</span>
                      @else
                        <span class="text-muted">-</span>
                      @endif
                    </td>
                  </tr>
                @endforeach
              </tbody>
            </table>
          @else
            <div class="box-body">
              <p class="text-muted text-center">No incoming transfers for this node.</p>
            </div>
          @endif
        </div>
        @if($incoming->hasPages())
          <div class="box-footer">
            {{ $incoming->appends(['outgoing' => request()->get('outgoing')])->links() }}
          </div>
        @endif
      </div>
    </div>
  </div>
@endsection
