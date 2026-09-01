import { NextResponse } from 'next/server';
import { ICloudCalDavClient } from '@/lib/reminders/icloudCalDav';
import type { ShoppingItem } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { appleId, appSpecificPassword, calendarHref, items } = body || {};

    if (!appleId || !appSpecificPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'Credenciales de Apple ID incompletas.',
        },
        { status: 400 }
      );
    }

    if (!calendarHref) {
      return NextResponse.json(
        {
          success: false,
          error: 'Debes seleccionar una lista de Recordatorios de destino.',
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No hay artículos en la lista de la compra para sincronizar.',
        },
        { status: 400 }
      );
    }

    const client = new ICloudCalDavClient({
      appleId: String(appleId),
      appSpecificPassword: String(appSpecificPassword),
    });

    const result = await client.syncShoppingList(String(calendarHref), items as ShoppingItem[]);

    return NextResponse.json({
      success: result.success,
      result,
    });
  } catch (error: any) {
    console.error('Error en POST /api/reminders/sync:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al sincronizar con Recordatorios de Apple',
      },
      { status: 500 }
    );
  }
}
