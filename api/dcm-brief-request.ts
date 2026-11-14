import type { IncomingMessage, ServerResponse } from 'http';
import { processDcmBriefRequest } from '../lib/dcmEmailService.js';

const MAX_BODY_BYTES = 32 * 1024; // 32kb limit

type IncomingVercelRequest = IncomingMessage & {
  body?: unknown;
};

function getClientIp(req: IncomingMessage): string {
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

async function readJsonBody(req: IncomingVercelRequest): Promise<{ ok: true; data: any } | { ok: false; statusCode: number; error: string }> {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') {
      if (Buffer.byteLength(req.body, 'utf8') > MAX_BODY_BYTES) {
        return { ok: false, statusCode: 413, error: 'Request payload is too large.' };
      }
      if (!req.body.trim()) return { ok: true, data: {} };
      try {
        return { ok: true, data: JSON.parse(req.body) };
      } catch {
        return { ok: false, statusCode: 400, error: 'Invalid JSON request payload.' };
      }
    }
    if (Buffer.isBuffer(req.body)) {
      if (req.body.length > MAX_BODY_BYTES) {
        return { ok: false, statusCode: 413, error: 'Request payload is too large.' };
      }
      const raw = req.body.toString('utf8');
      if (!raw.trim()) return { ok: true, data: {} };
      try {
        return { ok: true, data: JSON.parse(raw) };
      } catch {
        return { ok: false, statusCode: 400, error: 'Invalid JSON request payload.' };
      }
    }
    if (typeof req.body === 'object' && req.body !== null) {
      return { ok: true, data: req.body };
    }
  }

  return await new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    let settled = false;

    req.on('data', (chunk: Buffer | string) => {
      if (settled) return;
      const buf = typeof chunk === 'string' ? Buffer.from(chunk, 'utf8') : chunk;
      totalBytes += buf.length;
      if (totalBytes > MAX_BODY_BYTES) {
        settled = true;
        resolve({ ok: false, statusCode: 413, error: 'Request payload is too large.' });
        return;
      }
      chunks.push(buf);
    });

    req.on('end', () => {
      if (settled) return;
      settled = true;
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw.trim()) {
        resolve({ ok: true, data: {} });
        return;
      }
      try {
        resolve({ ok: true, data: JSON.parse(raw) });
      } catch {
        resolve({ ok: false, statusCode: 400, error: 'Invalid JSON request payload.' });
      }
    });

    req.on('error', () => {
      if (settled) return;
      settled = true;
      resolve({ ok: false, statusCode: 400, error: 'Unable to read request body.' });
    });
  });
}

export default async function handler(req: IncomingVercelRequest, res: ServerResponse): Promise<void> {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.statusCode = 405;
    res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
    return;
  }

  const parsed = await readJsonBody(req);
  if ('error' in parsed) {
    res.statusCode = parsed.statusCode;
    res.end(JSON.stringify({ success: false, error: parsed.error }));
    return;
  }

  try {
    const result = await processDcmBriefRequest({
      body: parsed.data,
      clientIp: getClientIp(req)
    });
    res.statusCode = result.statusCode;
    res.end(JSON.stringify(result.payload));
  } catch {
    res.statusCode = 500;
    res.end(
      JSON.stringify({
        success: false,
        error: 'Unable to process your request due to an unexpected server error. Please try again later.'
      })
    );
  }
}
