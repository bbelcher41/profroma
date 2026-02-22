import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const backend = process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:8000';
  const body = await req.formData();

  const response = await fetch(`${backend}/api/consolidate`, {
    method: 'POST',
    body,
  });

  const contentType = response.headers.get('content-type') || 'application/json';
  const raw = await response.arrayBuffer();
  return new NextResponse(raw, { status: response.status, headers: { 'content-type': contentType } });
}
