@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'captcha'])

@section('title')
  Captcha Settings
@endsection

@section('content-header')
  <h1>Captcha Settings<small>Configure captcha settings for your panel.</small></h1>
  <ol class="breadcrumb">
    <li><a href="{{ route('admin.index') }}">Admin</a></li>
    <li class="active">Settings</li>
  </ol>
@endsection

@section('content')
  @yield('settings::nav')
  <div class="row">
    <div class="col-xs-12">
    <form action="" method="POST">
      @csrf
      @method('PATCH')
      <div class="box">
      <div class="box-header with-border">
        <h3 class="box-title">CAPTCHA Provider</h3>
      </div>
      <div class="box-body">
        <div class="row">
        <div class="form-group col-md-4">
          <label class="control-label">Provider</label>
          <div>
          <select class="form-control" name="driver" id="captcha_provider">
            <option value="none" @if(isset($current) && $current['driver'] === 'none') selected @endif>Disabled
            </option>
            <option value="hcaptcha" @if(isset($current) && $current['driver'] === 'hcaptcha') selected @endif>
            hCaptcha</option>
            <option value="mcaptcha" @if(isset($current) && $current['driver'] === 'mcaptcha') selected @endif>
            mCaptcha</option>
            <option value="turnstile" @if(isset($current) && $current['driver'] === 'turnstile') selected @endif>
            Cloudflare
            Turnstile</option>
            <!-- <option value="proton" @if(isset($current) && $current['driver'] === 'proton') selected @endif>Proton Captcha -->
            <!-- </option> -->
            <option value="friendly" @if(isset($current) && $current['driver'] === 'friendly') selected @endif>
            Friendly Captcha
            </option>
            <!-- <option value="recaptcha" @if(isset($current) && $current['driver'] === 'recaptcha') selected @endif>
      ReCaptcha
      </option> -->
          </select>
          <p class="text-muted small">Select which CAPTCHA provider you want to use.</p>
          </div>
        </div>
        </div>
      </div>
      </div>

      <!-- hCaptcha Settings -->
      <div class="box provider-settings" id="hcaptcha_settings"
      style="@if(isset($current) && $current['driver'] !== 'hcaptcha') display: none; @endif">
      <div class="box-header with-border">
        <h3 class="box-title">hCaptcha Settings</h3>
      </div>
      <div class="box-body">
        <div class="row">
        <div class="form-group col-md-6">
          <label class="control-label">Site Key</label>
          <div>
          <input type="text" class="form-control" name="hcaptcha[site_key]"
            value="{{ old('hcaptcha.site_key', isset($current) ? $current['hcaptcha']['site_key'] : '') }}">
          </div>
        </div>
        <div class="form-group col-md-6">
          <label class="control-label">Secret Key</label>
          <div>
          <input type="text" class="form-control" name="hcaptcha[secret_key]"
            value="{{ old('hcaptcha.secret_key', isset($current) ? $current['hcaptcha']['secret_key'] : '') }}">
          <p class="text-muted small">Get your keys from <a href="https://dashboard.hcaptcha.com/"
            target="_blank">hCaptcha dashboard</a>.</p>
          </div>
        </div>
        </div>
      </div>
      </div>

      <!-- mCaptcha Settings -->
      <div class="box provider-settings" id="mcaptcha_settings"
      style="@if(isset($current) && $current['driver'] !== 'mcaptcha') display: none; @endif">
      <div class="box-header with-border">
        <h3 class="box-title">mCaptcha Settings</h3>
      </div>
      <div class="box-body">
        <div class="row">
        <div class="form-group col-md-4">
          <label class="control-label">Site Key</label>
          <div>
          <input type="text" class="form-control" name="mcaptcha[site_key]"
            value="{{ old('mcaptcha.site_key', isset($current) ? $current['mcaptcha']['site_key'] : '') }}">
          </div>
        </div>
        <div class="form-group col-md-4">
          <label class="control-label">Secret Key</label>
          <div>
          <input type="text" class="form-control" name="mcaptcha[secret_key]"
            value="{{ old('mcaptcha.secret_key', isset($current) ? $current['mcaptcha']['secret_key'] : '') }}">
          </div>
        </div>
        <div class="form-group col-md-4">
          <label class="control-label">Endpoint</label>
          <div>
          <input type="text" class="form-control" name="mcaptcha[endpoint]"
            value="{{ old('mcaptcha.endpoint', isset($current) ? $current['mcaptcha']['endpoint'] : '') }}">
          <p class="text-muted small">URL to your mCaptcha instance API endpoint.</p>
          </div>
        </div>
        </div>
      </div>
      </div>

      <!-- Cloudflare Turnstile Settings -->
      <div class="box provider-settings" id="turnstile_settings"
      style="@if(isset($current) && $current['driver'] !== 'turnstile') display: none; @endif">
      <div class="box-header with-border">
        <h3 class="box-title">Cloudflare Turnstile Settings</h3>
      </div>
      <div class="box-body">
        <div class="row">
        <div class="form-group col-md-6">
          <label class="control-label">Site Key</label>
          <div>
          <input type="text" class="form-control" name="turnstile[site_key]"
            value="{{ old('turnstile.site_key', isset($current) ? $current['turnstile']['site_key'] : '') }}">
          </div>
        </div>
        <div class="form-group col-md-6">
          <label class="control-label">Secret Key</label>
          <div>
          <input type="text" class="form-control" name="turnstile[secret_key]"
            value="{{ old('turnstile.secret_key', isset($current) ? $current['turnstile']['secret_key'] : '') }}">
          <p class="text-muted small">Get your keys from <a
            href="https://dash.cloudflare.com/?to=/:account/turnstile" target="_blank">Cloudflare dashboard</a>.
          </p>
          </div>
        </div>
        </div>
      </div>
      </div>

      <!-- Proton Captcha Settings -->
      <div class="box provider-settings" id="proton_settings"
      style="@if(isset($current) && $current['driver'] !== 'proton') display: none; @endif">
      <div class="box-header with-border">
        <h3 class="box-title">Proton Captcha Settings</h3>
      </div>
      <div class="box-body">
        <div class="row">
        <div class="form-group col-md-6">
          <label class="control-label">Site Key</label>
          <div>
          <input type="text" class="form-control" name="proton[site_key]"
            value="{{ old('proton.site_key', isset($current) && isset($current['proton']) ? $current['proton']['site_key'] : '') }}">
          </div>
        </div>
        <div class="form-group col-md-6">
          <label class="control-label">Secret Key</label>
          <div>
          <input type="text" class="form-control" name="proton[secret_key]"
            value="{{ old('proton.secret_key', isset($current) && isset($current['proton']) ? $current['proton']['secret_key'] : '') }}">
          <p class="text-muted small">Get your keys from <a href="https://account.proton.me/signup"
            target="_blank">Proton account</a>.</p>
          </div>
        </div>
        </div>
      </div>
      </div>

      <!-- Friendly Captcha Settings -->
      <div class="box provider-settings" id="friendly_settings"
      style="@if(isset($current) && $current['driver'] !== 'friendly') display: none; @endif">
      <div class="box-header with-border">
        <h3 class="box-title">Friendly Captcha Settings</h3>
      </div>
      <div class="box-body">
        <div class="row">
        <div class="form-group col-md-6">
          <label class="control-label">Site Key</label>
          <div>
          <input type="text" class="form-control" name="friendly[site_key]"
            value="{{ old('friendly.site_key', isset($current) ? $current['friendly']['site_key'] : '') }}">
          </div>
        </div>
        <div class="form-group col-md-6">
          <label class="control-label">Secret Key</label>
          <div>
          <input type="text" class="form-control" name="friendly[secret_key]"
            value="{{ old('friendly.secret_key', isset($current) ? $current['friendly']['secret_key'] : '') }}">
          <p class="text-muted small">Get your keys from <a href="https://friendlycaptcha.com/"
            target="_blank">Friendly Captcha</a>.</p>
          </div>
        </div>
        </div>
      </div>
      </div>


      <!-- Recaptcha Settings -->
      <div class="box provider-settings" id="recaptcha_settings"
      style="@if(isset($current) && $current['driver'] !== 'recaptcha') display: none; @endif">
      <div class="box-header with-border">
        <h3 class="box-title">Recaptcha Settings</h3>
      </div>
      <div class="box-body">
        <div class="row">
        <div class="form-group col-md-6">
          <label class="control-label">Site Key</label>
          <div>
          <input type="text" class="form-control" name="recaptcha[site_key]"
            value="{{ old('recaptcha.site_key', isset($current) ? $current['recaptcha']['site_key'] : '') }}">
          </div>
        </div>
        <div class="form-group col-md-6">
          <label class="control-label">Secret Key</label>
          <div>
          <input type="text" class="form-control" name="recaptcha[secret_key]"
            value="{{ old('recaptcha.secret_key', isset($current) ? $current['recaptcha']['secret_key'] : '') }}">
          <p class="text-muted small">Get your keys from <a href="https://www.google.com/recaptcha/admin/create"
            target="_blank">Google api Dashboard</a>.
          </p>
          </div>
        </div>
        </div>
      </div>
      </div>

      <div class="box box-primary">
      <div class="box-footer">
        {{ csrf_field() }}
        <button type="submit" class="btn btn-sm btn-primary pull-right">Save</button>
      </div>
      </div>
    </form>
    </div>
  </div>
@endsection

@section('footer-scripts')
  @parent
  <script>
    document.getElementById('captcha_provider').addEventListener('change', function () {

    document.querySelectorAll('.provider-settings').forEach(el => {
      el.style.display = 'none';
    });


    const selectedProvider = this.value;
    if (selectedProvider !== 'none') {
      document.getElementById(selectedProvider + '_settings').style.display = 'block';
    }
    });
  </script>
@endsection