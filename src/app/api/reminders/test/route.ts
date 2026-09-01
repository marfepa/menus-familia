import { NextResponse } from 'next/server';
import { ICloudCalDavClient } from '@/lib/reminders/icloudCalDav';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { appleId, appSpecificPassword } = body || {};

    if (!appleId || !appSpecificPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'Debes proporcionar tu Apple ID y la contraseña específica de aplicación.',
        },
        { status: 400 }
      );
    }

    const client = new ICloudCalDavClient({
      appleId: String(appleId),
      appSpecificPassword: String(appSpecificPassword),
    });

    const lists = await client.discoverRemindersLists();

    return NextResponse.json({
      success: true,
      lists,
    });
  } catch (error: any) {
    console.error('Error en POST /api/reminders/test:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al conectar con iCloud Recordatorios',
      },
      { status: 400 }
    );
  }
}
