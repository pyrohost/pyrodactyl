@extends('templates/wrapper', [
    'css' => ['body' => 'bg-black'],
])

@section('container')
    <div id="modal-portal"></div>
    <div data-pyro-app id="app"></div>
@endsection
