import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const backend = process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:8000';
  const body = await req.text();

  const response = await fetch(`${backend}/api/export-xlsx`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  const raw = await response.arrayBuffer();
  const headers = new Headers();
  headers.set(
    'content-type',
    response.headers.get('content-type') || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  headers.set('content-disposition', response.headers.get('content-disposition') || 'attachment; filename="consolidated.xlsx"');

  return new NextResponse(raw, { status: response.status, headers });
}
