<?php

namespace Pyrodactyl\Tests\Integration;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Pyrodactyl\Tests\TestCase;
use Illuminate\Support\Facades\Event;
use Pyrodactyl\Events\ActivityLogged;
use Pyrodactyl\Tests\Assertions\AssertsActivityLogged;
use Pyrodactyl\Tests\Traits\Integration\CreatesTestModels;
use Pyrodactyl\Transformers\Api\Application\BaseTransformer;

abstract class IntegrationTestCase extends TestCase
{
    use CreatesTestModels;
    use AssertsActivityLogged;

    protected array $connectionsToTransact = ['mysql'];

    protected $defaultHeaders = [
        'Accept' => 'application/json',
    ];

    public function setUp(): void
    {
        parent::setUp();

        Event::fake(ActivityLogged::class);
    }

    /**
     * Return an ISO-8601 formatted timestamp to use in the API response.
     */
    protected function formatTimestamp(string $timestamp): string
    {
        return CarbonImmutable::createFromFormat(CarbonInterface::DEFAULT_TO_STRING_FORMAT, $timestamp)
            ->setTimezone(BaseTransformer::RESPONSE_TIMEZONE)
            ->toAtomString();
    }
}
