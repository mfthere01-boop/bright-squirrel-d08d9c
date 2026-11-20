import { eq, like } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { documents } from '../../db/schema.js';
export default async (req: Request) => {
  const url = new URL(req.url), path = url.searchParams.get('path') || '';
  if (!/^(works|personas|meta)(\/[\w.-]+)?$/.test(path)) return Response.json({error:'Invalid path'}, {status:400});
  if (req.method !== 'GET' && req.headers.get('origin') && req.headers.get('origin') !== url.origin) return new Response('Forbidden', {status:403});
  try {
    if (req.method === 'GET') {
      const rows = await db.select().from(documents).where(path.includes('/') ? eq(documents.path,path) : like(documents.path,path+'/%'));
      return Response.json(path.includes('/') ? rows[0]?.data ?? null : rows.map(r=>r.data), {headers:{'Cache-Control':'no-store'}});
    }
    if (!path.includes('/')) return new Response('Document required', {status:400});
    if (req.method === 'PUT') {
      const data = await req.json();
      if (!data || typeof data !== 'object' || Array.isArray(data)) return new Response('Invalid document', {status:400});
      await db.insert(documents).values({path,data}).onConflictDoUpdate({target:documents.path,set:{data}});
      return Response.json({ok:true});
    }
    if (req.method === 'DELETE') { await db.delete(documents).where(eq(documents.path,path)); return Response.json({ok:true}); }
    return new Response('Method not allowed', {status:405});
  } catch { return Response.json({error:'Could not access saved log. Please try again.'}, {status:503}); }
};
export const config = {path:'/api/log'};
