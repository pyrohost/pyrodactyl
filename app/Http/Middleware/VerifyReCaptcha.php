<?php

namespace Pterodactyl\Http\Middleware;

use GuzzleHttp\Client;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Pterodactyl\Events\Auth\FailedCaptcha;
use Illuminate\Contracts\Config\Repository;
use Illuminate\Contracts\Events\Dispatcher;
use Symfony\Component\HttpKernel\Exception\HttpException;

class VerifyReCaptcha
{
    /**
     * VerifyReCaptcha constructor.
     */
    public function __construct(private Dispatcher $dispatcher, private Repository $config)
    {
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, \Closure $next): mixed
{
    if (!$this->config->get('recaptcha.enabled')) {
        return $next($request);
    }

    if ($request->filled('g-recaptcha-response')) {
        $client = new Client();
        $res = $client->post($this->config->get('recaptcha.domain'), [
            'form_params' => [
                'secret' => $this->config->get('recaptcha.secret_key'),
                'response' => $request->input('g-recaptcha-response'),
            ],
        ]);

        if ($res->getStatusCode() === 200) {
            $responseBody = json_decode($res->getBody(), true);
            if (isset($responseBody['success']) && $responseBody['success'] === true) {
                return $next($request);
            }
        }

        $domain = $this->config->get('recaptcha.domain', 'default_domain');
        $this->dispatcher->dispatch(new FailedCaptcha($request, $domain));
        throw new HttpException(Response::HTTP_UNPROCESSABLE_ENTITY, 'Invalid reCAPTCHA response.');
    }

    return $next($request);
}

    /**
     * Determine if the response from the recaptcha servers was valid.
     */
    private function isResponseVerified(\stdClass $result, Request $request): bool
    {
        if (!$this->config->get('recaptcha.verify_domain')) {
            return false;
        }

        $url = parse_url($request->url());

        return $result->hostname === array_get($url, 'host');
    }
}
