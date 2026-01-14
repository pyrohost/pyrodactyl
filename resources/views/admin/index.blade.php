@extends('layouts.admin')

@section('title')
  Administration
@endsection

@section('content-header')
  <h1>Administrative Overview<small>A quick glance at your system.</small></h1>
  <ol class="breadcrumb">
    <li><a href="{{ route('admin.index') }}">Admin</a></li>
    <li class="active">Index</li>
  </ol>
@endsection

@section('content')
  <div class="row">
    <div class="col-xs-12">
    <div class="box
      ">
      <div class="box-header with-border">
      <h3 class="box-title">System Information</h3>
      </div>
      <div class="box-body">
      You are running Pyrodactyl panel version <code>{{ config('app.version') }}</code>.
      </div>

      <!-- <div aria-hidden="true"
      style="background-color: #ffffff33; position: absolute; height: 1px; width: 100%; margin-top: 20px;"></div>
      <div class="row" style="margin-top: 20px;">
      <div class="col-md-3 col-sm-6 col-xs-12">
      <div class="small-box bg-[#000000]">
      <div class="inner">
      <h3 id="cpu-load">--</h3>
      <p>CPU Usage</p>
      </div>
      </div>
      </div>
      <div class="col-sm-6 col-lg-3">
      <div class="small-box bg-[#000000]">
      <div class="inner">
      <h3 id="ram-usage">--</h3>
      <p>Memory Usage</p>
      </div>
      </div>
      </div>

      <div class="col-sm-6 col-lg-3">

      <div class="small-box bg-[#000000]">
      <div class="inner items-center">
      <h3 id="disk-usage">--</h3>
      <p>Storage</p>
      </div>
      </div>
      </div>

      <div class="col-sm-6 col-lg-3">
      <div class="small-box bg-[#000000]">
      <div class="inner">
      <h3 id="uptime">--</h3>
      <p>System Uptime</p>
      </div>
      </div>
      </div> -->
      <!-- </div> -->
    </div>

    </div>
  </div>
  <div class="row">
    <div class="col-xs-6 col-sm-3 text-center">
    <a href="https://discord.gg/UhuYKKK2uM"><button class="btn btn-warning" style="width:100%;"><i
        class="fa fa-fw fa-support"></i> Get Help <small>(via Discord)</small></button></a>
    </div>
    <div class="col-xs-6 col-sm-3 text-center">
    <a href="https://pyrodactyl.dev"><button class="btn btn-primary" style="width:100%;"><i
        class="fa fa-fw fa-link"></i> Documentation</button></a>
    </div>
    <div class="clearfix visible-xs-block">&nbsp;</div>
    <div class="col-xs-6 col-sm-3 text-center">
    <a href="https://github.com/pyrohost/pyrodactyl"><button class="btn btn-primary" style="width:100%;"><i
        class="fa fa-fw fa-support"></i> Github</button></a>
    </div>
    <div class="col-xs-6 col-sm-3 text-center">
    <a href="{{ $version->getDonations() }}"><button class="btn btn-success" style="width:100%;"><i
        class="fa fa-fw fa-money"></i> Support the Project</button></a>
    </div>
  </div>
@endsection

@section('footer-scripts')
  @parent
  <script>
    $(document).ready(function () {
    function formatBytes(bytes, decimals = 2) {
      if (!bytes) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
    }

    function formatUptime(seconds) {
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${days}d ${hours}h ${minutes}m`;
    }

    function updateSystemMetrics() {
      $.ajax({
      url: '/api/application/panel/status',
      method: 'GET',
      success: function (data) {
        $('#cpu-load').text(`${data.metrics.cpu.toFixed(1)}%`);
        $('#ram-usage').html(
        `${formatBytes(data.metrics.memory.used)} Used <br><small>of ${formatBytes(data.metrics.memory.total)}</small>`
        );
        $('#disk-usage').html(
        `${formatBytes(data.metrics.disk.used)} Used <br><small>of ${formatBytes(data.metrics.disk.total)}</small>`
        );
        $('#uptime').text(formatUptime(data.metrics.uptime));
      },
      error: function (xhr) {
        console.error('Failed to fetch system metrics:', xhr.responseText);
      }
      });
    }

    // Initial update
    // updateSystemMetrics();

    // Update every 60 seconds
    // setInterval(updateSystemMetrics, 60000);
    });
  </script>

  <style>
    .small-box {
    transition: transform 0.2s ease;
    }

    .small-box:hover {
    transform: translateY(-3px);
    }

    .small-box .icon {
    font-size: 70px;
    opacity: 0.2;
    }

    .small-box h3 small {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
    }
  </style>
@endsection
