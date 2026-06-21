// Healthcheck do web (separado do /health da API).
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json({ ok: true, service: 'web', ts: new Date().toISOString() });
}
