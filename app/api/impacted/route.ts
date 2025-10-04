import { buildImpactedFeed } from '@/lib/impactedFeed';

export const runtime = 'edge';

function toHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

export async function GET(req: Request) {
  try {
    const feed = await buildImpactedFeed();
    const body = JSON.stringify(feed);
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body));
    const etag = '"' + toHex(hash) + '"';

    const inm = req.headers.get('if-none-match');
    if (inm) {
      const clean = (t: string) => t.trim().replace(/^W\//, '').replace(/^"|"$/g, '');
      const clientTags = inm.split(',').map((t) => clean(t));
      const serverTag = clean(etag);
      if (clientTags.includes(serverTag)) {
        return new Response(null, {
          status: 304,
          headers: {
            'ETag': etag,
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        });
      }
    }

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'ETag': etag,
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ version: new Date().toISOString().slice(0, 10), items: [] }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=300',
      },
    });
  }
}

export async function HEAD(req: Request) {
  // Reuse GET logic to compute the same ETag without sending a body
  try {
    const feed = await buildImpactedFeed();
    const body = JSON.stringify(feed);
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body));
    const etag = '"' + toHex(hash) + '"';

    const inm = req.headers.get('if-none-match');
    if (inm) {
      const clean = (t: string) => t.trim().replace(/^W\//, '').replace(/^"|"$/g, '');
      const clientTags = inm.split(',').map((t) => clean(t));
      const serverTag = clean(etag);
      if (clientTags.includes(serverTag)) {
        return new Response(null, {
          status: 304,
          headers: {
            'ETag': etag,
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        });
      }
    }

    return new Response(null, {
      status: 200,
      headers: {
        'ETag': etag,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch {
    return new Response(null, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=300',
      },
    });
  }
}


