import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok' }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
    }
  });
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
    }
  });
}
