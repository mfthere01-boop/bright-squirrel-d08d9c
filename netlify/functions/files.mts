import { getStore } from '@netlify/blobs';

export default async (req: Request) => {
  const url = new URL(req.url);
  if (req.method !== 'GET' && req.headers.get('origin') && req.headers.get('origin') !== url.origin) return new Response('Forbidden', { status: 403 });
  try {
    const store = () => getStore({ name: 'work-log-files', consistency: 'strong' });
    if (req.method === 'POST') {
      if (Number(req.headers.get('content-length')) > 4 * 1024 * 1024) return Response.json({ error: 'Choose a file under 4 MB.' }, { status: 413 });
      const bytes = await req.arrayBuffer();
      if (!bytes.byteLength || bytes.byteLength > 4 * 1024 * 1024) return Response.json({ error: 'Choose a nonempty file under 4 MB.' }, { status: 413 });
      const id = crypto.randomUUID();
      await store().set(id, bytes);
      return Response.json({ id, sizeBytes: bytes.byteLength, contentType: req.headers.get('content-type') || 'application/octet-stream' });
    }
    const id = url.searchParams.get('id') || '';
    if (!/^[a-f0-9-]{36}$/.test(id)) return Response.json({ error: 'Invalid file.' }, { status: 400 });
    if (req.method === 'GET') {
      const data = await store().get(id, { type: 'stream' });
      if (!data) return Response.json({ error: 'File not found.' }, { status: 404 });
      const name = (url.searchParams.get('name') || 'attachment').replace(/[\r\n]/g, '').slice(0, 240);
      return new Response(data, { headers: { 'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(name).replace(/'/g, '%27')}`, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store' } });
    }
    if (req.method === 'DELETE') {
      await store().delete(id);
      return Response.json({ ok: true });
    }
    return new Response('Method not allowed', { status: 405 });
  } catch {
    return Response.json({ error: 'File storage is unavailable. Please retry.' }, { status: 503 });
  }
};
export const config = { path: '/api/files' };
