<?php

namespace Pyrodactyl\Tests\Unit\Http\Middleware;

use Pyrodactyl\Tests\TestCase;
use Pyrodactyl\Tests\Traits\Http\RequestMockHelpers;
use Pyrodactyl\Tests\Traits\Http\MocksMiddlewareClosure;
use Pyrodactyl\Tests\Assertions\MiddlewareAttributeAssertionsTrait;

abstract class MiddlewareTestCase extends TestCase
{
    use MiddlewareAttributeAssertionsTrait;
    use MocksMiddlewareClosure;
    use RequestMockHelpers;

    /**
     * Setup tests with a mocked request object and normal attributes.
     */
    public function setUp(): void
    {
        parent::setUp();

        $this->buildRequestMock();
    }
}
