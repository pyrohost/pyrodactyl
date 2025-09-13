@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'domains'])

@section('title')
  Create Domain
@endsection

@section('content-header')
  <h1>Create Domain<small>Add a new DNS domain for subdomain management.</small></h1>
  <ol class="breadcrumb">
    <li><a href="{{ route('admin.index') }}">Admin</a></li>
    <li><a href="{{ route('admin.settings') }}">Settings</a></li>
    <li><a href="{{ route('admin.settings.domains.index') }}">Domains</a></li>
    <li class="active">Create</li>
  </ol>
@endsection

@section('content')
  @yield('settings::nav')
  <div class="row">
    <div class="col-xs-12">
      <form action="{{ route('admin.settings.domains.store') }}" method="POST" id="domain-form">
        <div class="box">
          <div class="box-header with-border">
            <h3 class="box-title">Domain Information</h3>
          </div>
          <div class="box-body">
            <div class="row">
              <div class="form-group col-md-6">
                <label for="name" class="control-label">Domain Name <span class="field-required"></span></label>
                <div>
                  <input type="text" name="name" id="name" class="form-control" value="{{ old('name') }}"
                    placeholder="example.com" required />
                  <p class="text-muted small">The domain name that will be used for subdomains (e.g., example.com).</p>
                </div>
              </div>
              <div class="form-group col-md-6">
                <label for="dns_provider" class="control-label">DNS Provider <span class="field-required"></span></label>
                <div>
                  <select name="dns_provider" id="dns_provider" class="form-control" required>
                    <option value="">Select a DNS provider...</option>
                    @foreach($providers as $key => $provider)
                      <option value="{{ $key }}" @if(old('dns_provider') === $key) selected @endif>
                        {{ $provider['name'] }}
                      </option>
                    @endforeach
                  </select>
                  <p class="text-muted small">The DNS service provider that manages this domain.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="box" id="dns-config-box" style="display: none;">
          <div class="box-header with-border">
            <h3 class="box-title">DNS Provider Configuration</h3>
          </div>
          <div class="box-body" id="dns-config-content">
            <!-- Dynamic content will be loaded here -->
          </div>
        </div>

        <div class="box">
          <div class="box-header with-border">
            <h3 class="box-title">Additional Settings</h3>
          </div>
          <div class="box-body">
            <div class="row">
              <div class="form-group col-md-6">
                <label class="control-label">Status</label>
                <div>
                  <div class="btn-group" data-toggle="buttons">
                    <label class="btn btn-outline-primary @if(old('is_active', true)) active @endif">
                      <input type="radio" name="is_active" value="1" @if(old('is_active', true)) checked @endif> Active
                    </label>
                    <label class="btn btn-outline-primary @if(!old('is_active', true)) active @endif">
                      <input type="radio" name="is_active" value="0" @if(!old('is_active', true)) checked @endif> Inactive
                    </label>
                  </div>
                  <p class="text-muted small">Whether this domain should be available for subdomain creation.</p>
                </div>
              </div>
              <div class="form-group col-md-6">
                <label class="control-label">Default Domain</label>
                <div>
                  <div class="btn-group" data-toggle="buttons">
                    <label class="btn btn-outline-primary @if(old('is_default', false)) active @endif">
                      <input type="radio" name="is_default" value="1" @if(old('is_default', false)) checked @endif> Yes
                    </label>
                    <label class="btn btn-outline-primary @if(!old('is_default', false)) active @endif">
                      <input type="radio" name="is_default" value="0" @if(!old('is_default', false)) checked @endif> No
                    </label>
                  </div>
                  <p class="text-muted small">Whether this domain should be used as the default for automatic subdomain
                    generation.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="box box-primary">
          <div class="box-footer">
            {{ csrf_field() }}
            <button type="button" id="test-connection" class="btn btn-sm btn-info" disabled>
              <i class="fa fa-refresh fa-spin" style="display: none;"></i> Test Connection
            </button>
            <a href="{{ route('admin.settings.domains.index') }}" class="btn btn-sm btn-default">Cancel</a>
            <button type="submit" class="btn btn-sm btn-success pull-right">Create Domain</button>
          </div>
        </div>
      </form>
    </div>
  </div>
@endsection

@section('footer-scripts')
  @parent
  <script>
    $(document).ready(function () {
      const $providerSelect = $('#dns_provider');
      const $configBox = $('#dns-config-box');
      const $configContent = $('#dns-config-content');
      const $testButton = $('#test-connection');
      const $form = $('#domain-form');

      // Handle provider selection
      $providerSelect.change(function () {
        const provider = $(this).val();

        if (provider) {
          loadProviderConfig(provider);
          $testButton.prop('disabled', false);
        } else {
          $configBox.hide();
          $testButton.prop('disabled', true);
        }
      });

      // Test connection
      $testButton.click(function () {
        const $button = $(this);
        const $spinner = $button.find('.fa-spin');

        // Gather form data
        const formData = {
          dns_provider: $providerSelect.val(),
          dns_config: {}
        };

        // Collect DNS config fields
        $configContent.find('input').each(function () {
          const name = $(this).attr('name');
          if (name && name.startsWith('dns_config[')) {
            const key = name.replace('dns_config[', '').replace(']', '');
            formData.dns_config[key] = $(this).val();
          }
        });

        $button.prop('disabled', true);
        $spinner.show();

        $.post('{{ route('admin.settings.domains.test-connection') }}', {
          _token: '{{ csrf_token() }}',
          ...formData
        })
          .done(function (response) {
            if (response.success) {
              swal({
                type: 'success',
                title: 'Connection Successful',
                text: response.message
              });
            } else {
              swal({
                type: 'error',
                title: 'Connection Failed',
                text: response.message
              });
            }
          })
          .fail(function (xhr) {
            const response = xhr.responseJSON || {};
            swal({
              type: 'error',
              title: 'Connection Failed',
              text: response.message || 'An unexpected error occurred.'
            });
          })
          .always(function () {
            $button.prop('disabled', false);
            $spinner.hide();
          });
      });

      // Load provider configuration
      function loadProviderConfig(provider) {
        $.get(`{{ route('admin.settings.domains.provider-schema', ':provider') }}`.replace(':provider', provider))
          .done(function (response) {
            if (response.success) {
              renderConfigForm(response.schema);
              $configBox.show();
            }
          })
          .fail(function () {
            $configBox.hide();
          });
      }

      // Render configuration form
      function renderConfigForm(schema) {
        let html = '<div class="row">';

        Object.keys(schema).forEach(function (key) {
          const field = schema[key];
          const oldValue = `{{ old('dns_config.${key}') }}`.replace('${key}', key);

          html += `
                          <div class="form-group col-md-6">
                            <label for="dns_config_${key}" class="control-label">
                              ${field.description || key} 
                              ${field.required ? '<span class="field-required"></span>' : ''}
                            </label>
                            <div>
                              <input type="${field.sensitive ? 'password' : 'text'}" 
                                     name="dns_config[${key}]" 
                                     id="dns_config_${key}" 
                                     class="form-control" 
                                     value="${oldValue}"
                                     ${field.required ? 'required' : ''} />
                            </div>
                          </div>
                        `;
        });

        html += '</div>';
        $configContent.html(html);
      }

      // Trigger change if provider is pre-selected
      if ($providerSelect.val()) {
        $providerSelect.trigger('change');
      }
    });
  </script>
@endsection