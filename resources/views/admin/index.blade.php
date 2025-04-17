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
    </div>
    </div>
  </div>
  <div class="row">
    <div class="col-xs-6 col-sm-3 text-center">
    <a href="https://discord.gg/UhuYKKK2uM"><button class="btn btn-warning" style="width:100%;"><i
        class="fa fa-fw fa-support"></i> Get Help <small>(via Discord)</small></button></a>
    </div>
    <div class="col-xs-6 col-sm-3 text-center">
    <a href="https://github.com/pyrohost/pyrodactyl/wiki"><button class="btn btn-primary" style="width:100%;"><i
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