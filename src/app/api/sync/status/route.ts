import { NextResponse } from 'next/server';
import { getStoreStatus } from '@/lib/cloudStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = await getStoreStatus();
    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error('Error en GET /api/sync/status:', error);
    return NextResponse.json(
      {
        success: false,
        status: {
          configured: false,
          provider: 'unconfigured',
          message: 'Error al comprobar estado de la nube',
        },
      },
      { status: 500 }
    );
  }
}
