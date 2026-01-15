@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'captcha'])

@section('title')
  Captcha Settings
@endsection

@section('content-header')
  <h1>Captcha Settings<small>Configure captcha protection for authentication forms.</small></h1>
  <ol class="breadcrumb">
    <li><a href="{{ route('admin.index') }}">Admin</a></li>
    <li class="active">Settings</li>
  </ol>
@endsection

@section('content')
  @yield('settings::nav')
  <div class="row">
    <div class="col-xs-12">
      <form action="{{ route('admin.settings.captcha') }}" method="POST">
        <div class="box">
          <div class="box-header with-border">
            <h3 class="box-title">Captcha Provider</h3>
          </div>
          <div class="box-body">
            <div class="row">
              <div class="form-group col-md-4">
                <label class="control-label">Provider</label>
                <div>
                  <select name="pterodactyl:captcha:provider" class="form-control" id="captcha-provider">
                    @foreach($providers as $key => $name)
                      <option value="{{ $key }}" @if(old('pterodactyl:captcha:provider', config('pterodactyl.captcha.provider', 'none')) === $key) selected @endif>{{ $name }}</option>
                    @endforeach
                  </select>
                  <p class="text-muted"><small>Select the captcha provider to use for authentication forms.</small></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="box" id="turnstile-settings" style="display: none;">
          <div class="box-header with-border">
            <h3 class="box-title">Cloudflare Turnstile Configuration</h3>
          </div>
          <div class="box-body">
            <div class="row">
              <div class="form-group col-md-6">
                <label class="control-label">Site Key</label>
                <div>
                  <input type="text" class="form-control" name="pterodactyl:captcha:turnstile:site_key"
                    value="{{ old('pterodactyl:captcha:turnstile:site_key', config('pterodactyl.captcha.turnstile.site_key', '')) }}" />
                  <p class="text-muted"><small>The site key provided by Cloudflare Turnstile. This is used in the frontend widget.</small></p>
                </div>
              </div>
              <div class="form-group col-md-6">
                <label class="control-label">Secret Key</label>
                <div>
                  <input type="password" class="form-control" name="pterodactyl:captcha:turnstile:secret_key"
                    value="{{ old('pterodactyl:captcha:turnstile:secret_key', config('pterodactyl.captcha.turnstile.secret_key', '')) }}" />
                  <p class="text-muted"><small>The secret key provided by Cloudflare Turnstile. This is used for server-side verification.</small></p>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-md-12">
                <div class="alert alert-info">
                  <strong>Setup Instructions:</strong>
                  <ol>
                    <li>Visit the <a href="https://dash.cloudflare.com/?to=/:account/turnstile" target="_blank">Cloudflare Turnstile dashboard</a></li>
                    <li>Create a new site or select an existing one</li>
                    <li>Add your domain to the site configuration</li>
                    <li>Copy the Site Key and Secret Key from the dashboard</li>
                    <li>Paste them into the fields above</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="box" id="hcaptcha-settings" style="display: none;">
          <div class="box-header with-border">
            <h3 class="box-title">hCaptcha Configuration</h3>
          </div>
          <div class="box-body">
            <div class="row">
              <div class="form-group col-md-6">
                <label class="control-label">Site Key</label>
                <div>
                  <input type="text" class="form-control" name="pterodactyl:captcha:hcaptcha:site_key"
                    value="{{ old('pterodactyl:captcha:hcaptcha:site_key', config('pterodactyl.captcha.hcaptcha.site_key', '')) }}" />
                  <p class="text-muted"><small>The site key provided by hCaptcha. This is used in the frontend widget.</small></p>
                </div>
              </div>
              <div class="form-group col-md-6">
                <label class="control-label">Secret Key</label>
                <div>
                  <input type="password" class="form-control" name="pterodactyl:captcha:hcaptcha:secret_key"
                    value="{{ old('pterodactyl:captcha:hcaptcha:secret_key', config('pterodactyl.captcha.hcaptcha.secret_key', '')) }}" />
                  <p class="text-muted"><small>The secret key provided by hCaptcha. This is used for server-side verification.</small></p>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-md-12">
                <div class="alert alert-info">
                  <strong>Setup Instructions:</strong>
                  <ol>
                    <li>Visit the <a href="https://dashboard.hcaptcha.com/sites" target="_blank">hCaptcha dashboard</a></li>
                    <li>Create a new site or select an existing one</li>
                    <li>Add your domain to the site configuration</li>
                    <li>Copy the Site Key and Secret Key from the dashboard</li>
                    <li>Paste them into the fields above</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="box" id="recaptcha-settings" style="display: none;">
          <div class="box-header with-border">
            <h3 class="box-title">Google reCAPTCHA v3 Configuration</h3>
          </div>
          <div class="box-body">
            <div class="row">
              <div class="form-group col-md-6">
                <label class="control-label">Site Key</label>
                <div>
                  <input type="text" class="form-control" name="pterodactyl:captcha:recaptcha:site_key"
                    value="{{ old('pterodactyl:captcha:recaptcha:site_key', config('pterodactyl.captcha.recaptcha.site_key', '')) }}" />
                  <p class="text-muted"><small>The site key provided by Google reCAPTCHA v3. This is used in the frontend integration.</small></p>
                </div>
              </div>
              <div class="form-group col-md-6">
                <label class="control-label">Secret Key</label>
                <div>
                  <input type="password" class="form-control" name="pterodactyl:captcha:recaptcha:secret_key"
                    value="{{ old('pterodactyl:captcha:recaptcha:secret_key', config('pterodactyl.captcha.recaptcha.secret_key', '')) }}" />
                  <p class="text-muted"><small>The secret key provided by Google reCAPTCHA v3. This is used for server-side verification.</small></p>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-md-12">
                <div class="alert alert-info">
                  <strong>reCAPTCHA v3 Setup Instructions:</strong>
                  <ol>
                    <li>Visit the <a href="https://www.google.com/recaptcha/admin" target="_blank">Google reCAPTCHA admin console</a></li>
                    <li>Create a new site and select <strong>reCAPTCHA v3</strong></li>
                    <li>Add your domain(s) to the site configuration</li>
                    <li>Copy the Site Key and Secret Key from the dashboard</li>
                    <li>Paste them into the fields above</li>
                  </ol>
                  <p><strong>Note:</strong> reCAPTCHA v3 runs invisibly in the background and returns a score (0.0-1.0) based on user interactions. A threshold of 0.5 is used by default.</p>
                </div>
              </div>
            </div>
          </div>
        </div>


        <div class="box box-primary">
          <div class="box-footer">
            {{ csrf_field() }}
            <button type="submit" name="_method" value="PATCH" class="btn btn-sm btn-primary pull-right">Save</button>
          </div>
        </div>
      </form>
    </div>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const providerSelect = document.getElementById('captcha-provider');
      const turnstileSettings = document.getElementById('turnstile-settings');
      const hcaptchaSettings = document.getElementById('hcaptcha-settings');
      const recaptchaSettings = document.getElementById('recaptcha-settings');

      function toggleSettings() {
        const provider = providerSelect.value;

        // Hide all provider-specific settings first
        turnstileSettings.style.display = 'none';
        hcaptchaSettings.style.display = 'none';
        recaptchaSettings.style.display = 'none';

        if (provider === 'turnstile') {
          turnstileSettings.style.display = 'block';
        } else if (provider === 'hcaptcha') {
          hcaptchaSettings.style.display = 'block';
        } else if (provider === 'recaptcha') {
          recaptchaSettings.style.display = 'block';
        }
      }

      providerSelect.addEventListener('change', toggleSettings);

      // Initialize on page load with a small delay to ensure DOM is ready
      setTimeout(toggleSettings, 100);
    });
  </script>
@endsection
