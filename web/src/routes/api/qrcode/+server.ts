import type { RequestHandler } from '@sveltejs/kit';
import QRCode from 'qrcode';

export const POST: RequestHandler = async ({ request }) => {
  if (!request.headers.has('Content-Type') || request.headers.get('Content-Type') !== 'text/plain') {
    return new Response(null, { status: 400, headers: { 'Content-Type': 'text/plain' } });
  }

  const body = await request.text();
  const data = await QRCode.toDataURL(body, {
    errorCorrectionLevel: 'H',
    width: 500,
  });

  return new Response(data, { status: 200, headers: { 'Content-Type': 'text/plain' } });
};
