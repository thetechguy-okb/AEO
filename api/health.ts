import type { IncomingMessage, ServerResponse } from 'http';
import { getHealthPayload } from '../lib/dcmEmailService';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    res.statusCode = 405;
    res.end(JSON.stringify({ status: 'error', error: 'Method Not Allowed' }));
    return;
  }

  const payload = getHealthPayload();
  res.statusCode = 200;
  res.end(req.method === 'HEAD' ? '' : JSON.stringify(payload));
}
