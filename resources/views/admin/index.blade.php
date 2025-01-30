@extends('layouts.admin')

@section('title')
    Admin Overview
@endsection

@section('content-header')
    <h1>Administrative Overview<small>A quick overview of your system.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li class="active">Overview</li>
    </ol>
@endsection

@section('content')
    <div class="row">
        <div class="col-xs-12">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">System Information</h3>
                </div>
                <div class="box-body">
                    <p class="text-muted">Your running Pastel, based off pyrodactyl. <code>{{ config('app.version') }}</code></p>
                    
                    <div class="row" style="margin-top: 20px;">
                        <div class="col-md-3 col-sm-6 col-xs-12">
                            <div class="small-box bg-aqua">
                                <div class="inner">
                                    <h3 id="cpu-load">--</h3>
                                    <p>CPU Usage</p>
                                </div>
                                <div class="icon">
                                    <i class="fa fa-microchip"></i>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-3 col-sm-6 col-xs-12">
                            <div class="small-box bg-green">
                                <div class="inner">
                                    <h3 id="ram-usage">--</h3>
                                    <p>Memory Usage</p>
                                </div>
                                <div class="icon">
                                    <i class="fa fa-memory"></i>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-3 col-sm-6 col-xs-12">
                            <div class="small-box bg-yellow">
                                <div class="inner">
                                    <h3 id="disk-usage">--</h3>
                                    <p>Storage</p>
                                </div>
                                <div class="icon">
                                    <i class="fa fa-hdd"></i>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-3 col-sm-6 col-xs-12">
                            <div class="small-box bg-red">
                                <div class="inner">
                                    <h3 id="uptime">--</h3>
                                    <p>System Uptime</p>
                                </div>
                                <div class="icon">
                                    <i class="fa fa-clock"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-xs-6 col-sm-3 text-center">
            <a href="{{ $version->getDiscord() }}" class="btn btn-warning btn-block">
                <i class="fa fa-fw fa-support"></i> Get Help <small>(via Discord)</small>
            </a>
        </div>
        <div class="col-xs-6 col-sm-3 text-center">
            <a href="https://pterodactyl.io" class="btn btn-primary btn-block">
                <i class="fa fa-fw fa-link"></i> Documentation
            </a>
        </div>
        
    </div>
@endsection

@section('footer-scripts')
    @parent
    <script>
        $(document).ready(function() {
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
                    url: '/api/application/status',
                    method: 'GET',
                    success: function(data) {
                        $('#cpu-load').text(`${data.metrics.cpu.toFixed(1)}%`);
                        $('#ram-usage').html(
                            `${formatBytes(data.metrics.memory.used)}<br><small>${formatBytes(data.metrics.memory.total)}</small>`
                        );
                        $('#disk-usage').html(
                            `${formatBytes(data.metrics.disk.used)}<br><small>${formatBytes(data.metrics.disk.total)}</small>`
                        );
                        $('#uptime').text(formatUptime(data.metrics.uptime));
                    },
                    error: function(xhr) {
                        console.error('Failed to fetch system metrics:', xhr.responseText);
                    }
                });
            }

            // Initial update
            updateSystemMetrics();
            
            // Update every 60 seconds
            setInterval(updateSystemMetrics, 60000);
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
            color: rgba(255,255,255,0.8);
        }
    </style>
@endsection