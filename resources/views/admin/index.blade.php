@extends('layouts.admin')

@section('title')
    Administration
@endsection

@section('content-header')
    <h1>Administrative Overview<small>Real-time system monitoring</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li class="active">Dashboard</li>
    </ol>
@endsection

@section('content')
    <div class="row">
        <div class="col-xs-12">
            <div class="box box-primary" style="border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div class="box-header with-border">
                    <h3 class="box-title">System Monitor</h3>
                    <div class="box-tools pull-right">
                        <span id="connection-status" class="label label-success">
                            <i class="fa fa-circle"></i> Live
                        </span>
                    </div>
                </div>
                <div class="box-body">
                    <p class="text-muted">
                        Pyrodactyl Panel <code>{{ config('app.version') }}</code> — Real-time system metrics
                    </p>
                    
                    <div class="row" style="margin-top: 25px;">
                        <div class="col-md-3 col-sm-6 col-xs-12">
                            <div class="metric-card">
                                <div class="metric-icon ">
                                    <x-lucide-cpu class="w-1 h-1 text-gray-500"/>
                                </div>
                                <div class="metric-details">
                                    <h4 id="cpu-load">--</h4>
                                    <span>CPU Usage</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-3 col-sm-6 col-xs-12">
                            <div class="metric-card">
                                <div class="metric-icon ">
                                    <x-lucide-memory-stick class="w-1/10 h-1/10  text-gray-500"/>
                                </div>
                                <div class="metric-details">
                                    <h4 id="ram-usage">--</h4>
                                    <span>Memory Usage</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-3 col-sm-6 col-xs-12">
                            <div class="metric-card">
                                <div class="metric-icon ">
                                    <x-lucide-hard-drive class="w-1 h-1 text-gray-500"/>
                                </div>
                                <div class="metric-details">
                                    <h4 id="disk-usage">--</h4>
                                    <span>Storage</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-3 col-sm-6 col-xs-12">
                            <div class="metric-card">
                                <div class="metric-icon ">
                                    <x-lucide-clock-2 class="w-1 h-1 text-gray-500"/>
                                </div>
                                <div class="metric-details">
                                    <h4 id="uptime">--</h4>
                                    <span>System Uptime</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="system-details-container" style="margin-top: 30px;">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="info-box" style="border-radius: 6px;">
                                    <div class="info-box-content">
                                        <h4 class="text-muted">System Information</h4>
                                        <div class="table-responsive">
                                            <table class="table table-borderless">
                                                <tbody>
                                                    <tr>
                                                        <td width="30%">Operating System</td>
                                                        <td id="os-info">--</td>
                                                    </tr>
                                                    <tr>
                                                        <td>PHP Version</td>
                                                        <td id="php-version">--</td>
                                                    </tr>
                                                    <tr>
                                                        <td>Hostname</td>
                                                        <td id="hostname">--</td>
                                                    </tr>
                                                    <tr>
                                                        <td>Load Average</td>
                                                        <td id="load-average">--</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <canvas id="cpu-chart" height="200"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="row">
        <div class="col-xs-6 col-sm-3 text-center">
            <a href="https://discord.gg/UhuYKKK2uM" class="resource-btn discord">
                <i class="fa fa-discord"></i> Get Help
                <small>(via Discord)</small>
            </a>
        </div>
        <div class="col-xs-6 col-sm-3 text-center">
            <a href="https://github.com/pyrohost/pyrodactyl/wiki" class="resource-btn docs">
                <i class="fa fa-book"></i> Documentation
            </a>
        </div>
        <div class="clearfix visible-xs-block">&nbsp;</div>
        <div class="col-xs-6 col-sm-3 text-center">
            <a href="https://github.com/pyrohost/pyrodactyl" class="resource-btn github">
                <i class="fa fa-github"></i> Github
            </a>
        </div>
        <div class="col-xs-6 col-sm-3 text-center">
            <a href="{{ $version->getDonations() }}" class="resource-btn donate">
                <i class="fa fa-heart"></i> Support the Project
            </a>
        </div>
    </div>
@endsection

@section('footer-scripts')
    @parent
    <script src="https://cdn.jsdelivr.net/npm/chart.js@3.7.1/dist/chart.min.js"></script>
    <script>
        $(document).ready(function () {
            // Formatting utilities
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
            
            // Initialize CPU usage chart
            const cpuData = {
            labels: Array(20).fill(''),
            datasets: [{
                label: 'CPU Usage %',
                data: Array(20).fill(0),
                borderColor: '#3c8dbc',
                backgroundColor: 'rgba(60, 141, 188, 0.2)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        };
            
            const cpuChart = new Chart(document.getElementById('cpu-chart'), {
                type: 'line',
                data: cpuData,
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: 'CPU Usage (%) - Real-time',
                            color: '#666'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        },
                        x: {
                            display: false
                        }
                    },
                    animation: {
                        duration: 400
                    }
                }
            });
            
            // Set up EventSource for real-time updates
            let eventSource;
            
            function connectEventSource() {
                eventSource = new EventSource('/api/application/panel/status/stream');
                
                eventSource.addEventListener('metrics', function(event) {
                    const data = JSON.parse(event.data);
                    updateDashboard(data);
                    
                    // Update connection status
                    $('#connection-status').removeClass('label-warning label-danger').addClass('label-success');
                    $('#connection-status').html('<i class="fa fa-circle"></i> Live');
                });
                
                eventSource.addEventListener('error', function(event) {
                    // Handle errors
                    $('#connection-status').removeClass('label-success').addClass('label-warning');
                    $('#connection-status').html('<i class="fa fa-exclamation-circle"></i> Reconnecting...');
                    
                    // Try to reconnect after 3 seconds
                    setTimeout(function() {
                        if (eventSource.readyState === EventSource.CLOSED) {
                            connectEventSource();
                        }
                    }, 3000);
                });
            }
            
            function updateDashboard(data) {
                // Update metrics displays
                $('#cpu-load').text(`${data.metrics.cpu.toFixed(1)}%`);
                $('#ram-usage').html(
                    `${formatBytes(data.metrics.memory.used)} <small>/ ${formatBytes(data.metrics.memory.total)}</small>`
                );
                $('#disk-usage').html(
                    `${formatBytes(data.metrics.disk.used)} <small>/ ${formatBytes(data.metrics.disk.total)}</small>`
                );
                $('#uptime').text(formatUptime(data.metrics.uptime));
                
                // Update system details
                $('#os-info').text(data.system.os.split(' ')[0]);
                $('#php-version').text(data.system.php_version);
                $('#hostname').text(data.system.hostname);
                $('#load-average').text(data.system.load_average.join(' / '));
                
                // Update chart
                cpuData.datasets[0].data.shift();
                cpuData.datasets[0].data.push(data.metrics.cpu);
                cpuChart.update();
            }
            
            // Start connection
            connectEventSource();
            
            // Fallback to AJAX if SSE isn't supported or fails to connect
            setTimeout(function() {
                if (!eventSource || eventSource.readyState !== EventSource.OPEN) {
                    $('#connection-status').removeClass('label-success label-warning').addClass('label-danger');
                    $('#connection-status').html('<i class="fa fa-exclamation-triangle"></i> Fallback Mode');
                    
                    // Regular polling as fallback
                    function updateSystemMetrics() {
                        $.ajax({
                            url: '/api/application/panel/status', // implement this later please. It will manually ping.
                            method: 'GET',
                            success: function(data) {
                                updateDashboard(data);
                            },
                            error: function(xhr) {
                                console.error('Failed to fetch system metrics:', xhr.responseText);
                            }
                        });
                    }
                    
                    // Initial update
                    updateSystemMetrics();
                    
                    // Update every 5 seconds
                    setInterval(updateSystemMetrics, 5000);
                }
            }, 5000);
        });
    </script>

    <style>
        .metric-card {
            display: flex;
            background: black;
            border-radius: 8px;
            box-shadow: 0 1px 8px rgba(0,0,0,0.05);
            padding: 15px;
            transition: all 0.2s ease;
            height: 100px;
            margin-bottom: 20px;
        }
        
        .metric-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .metric-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            color: white;
            font-size: 24px;
        }
        
        .metric-details {
            margin-left: 15px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        
        .metric-details h4 {
            margin: 0;
            font-size: 22px;
            font-weight: 600;
        }
        
        .metric-details span {
            color: #777;
            font-size: 14px;
        }
        
        .metric-details small {
            font-size: 12px;
            color: #999;
        }

        /* HAHA later i found out it looks nicer. */
        .bg-blue { background-color: black; }
        .bg-green { background-color: black; }
        .bg-purple { background-color: black; }
        .bg-orange { background-color: black; }
        
        .system-details-container {
            background: black;
            border-radius: 8px;
            padding: 20px;
        }
        
        .table-borderless td {
            border: none !important;
        }
        
        .resource-btn {
            display: block;
            padding: 15px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            margin-bottom: 15px;
            transition: all 0.2s ease;
            text-decoration: none;
        }
        
        .resource-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            color: white;
            text-decoration: none;
        }
        
        .resource-btn small {
            display: block;
            font-size: 12px;
            opacity: 0.8;
        }
        
        .discord { background: #7289da; }
        .docs { background: #3498db; }
        .github { background: #333; }
        .donate { background: #e74c3c; }
        
        .info-box {
            box-shadow: 0 1px 5px rgba(0,0,0,0.05);
            background: black;
            padding: 15px;
        }
        
        #connection-status {
            margin-top: 5px;
        }
        
        #connection-status i {
            font-size: 10px;
        }
    </style>
@endsection