<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class NormalizeHtmlEscapedSignature
{
    public function handle(Request $request, Closure $next): Response
    {
        $queryString = (string) $request->server->get('QUERY_STRING', '');

        if (str_contains($queryString, 'amp;signature=')) {
            $request->server->set(
                'QUERY_STRING',
                preg_replace('/(^|&)amp;signature=/', '$1signature=', $queryString, 1) ?? $queryString,
            );
        }

        if (! $request->query->has('signature') && $request->query->has('amp;signature')) {
            $request->query->set('signature', (string) $request->query->get('amp;signature'));
            $request->query->remove('amp;signature');
        }

        return $next($request);
    }
}
