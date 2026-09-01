import { NextResponse } from 'next/server';
import { getCloudFamilyData, saveCloudFamilyData } from '@/lib/cloudStore';
import {
  parseRemindersPayload,
  mergeImportedItemsIntoShoppingList,
} from '@/lib/reminders/reminderImporter';
import { getMonday } from '@/lib/utils';
import { INITIAL_RECIPES } from '@/data/initialRecipes';
import { DEFAULT_PANTRY, DEFAULT_SETTINGS } from '@/data/defaultPantry';
import type { FamilySyncPayload } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reminders/import
 * Devuelve el estado e información sobre cómo utilizar el webhook de Atajos de Apple / Siri.
 */
export async function GET() {
  const currentWeek = getMonday(new Date());
  return NextResponse.json({
    status: 'online',
    endpoint: '/api/reminders/import',
    description:
      'Endpoint para importar productos desde Apple Reminders, Atajos de Apple o Siri hacia la lista de la compra familiar.',
    method: 'POST',
    currentWeek,
    acceptedFormats: [
      'Texto plano multilínea con "Content-Type: text/plain"',
      'Array JSON: ["2 kg de patatas", "1 docena de huevos", "Pechuga de pollo"]',
      'Array de objetos Apple: [{ "Title": "Leche", "Notes": "Desnatada" }]',
      'Objeto JSON: { "items": ["Leche", "Arroz"] } o { "reminders": [...] } o { "Reminders": [...] }',
      'Objeto JSON con semana opcional: { "weekStartDate": "YYYY-MM-DD", "items": [...] }',
    ],
  });
}

/**
 * POST /api/reminders/import
 * Recibe productos de Recordatorios y los añade a la lista de la compra familiar.
 */
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let body: any;
    let targetWeek: string | undefined;

    if (contentType.includes('application/json')) {
      try {
        body = await request.json();
      } catch {
        body = await request.text();
      }
    } else {
      const rawText = await request.text();
      try {
        body = JSON.parse(rawText);
      } catch {
        body = rawText;
      }
    }

    if (body && typeof body === 'object' && !Array.isArray(body)) {
      if (body.weekStartDate || body.week || body.semana) {
        targetWeek = String(body.weekStartDate || body.week || body.semana);
      }
    }

    // Si viene la semana por query param ?week=YYYY-MM-DD
    const url = new URL(request.url);
    const queryWeek = url.searchParams.get('week');
    if (queryWeek) {
      targetWeek = queryWeek;
    }

    const weekStartDate = targetWeek || getMonday(new Date());

    const parsedItems = parseRemindersPayload(body);

    if (!parsedItems || parsedItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'No se encontraron artículos válidos para importar. Envía una lista de nombres de productos en texto o JSON.',
        },
        { status: 400 }
      );
    }

    // Obtener estado actual de la nube
    const existingCloudData = await getCloudFamilyData();

    const payload: FamilySyncPayload = existingCloudData
      ? { ...existingCloudData }
      : {
          version: 1,
          updatedAt: new Date().toISOString(),
          deviceId: 'apple_shortcuts_webhook',
          recipes: INITIAL_RECIPES,
          plans: {},
          shoppingLists: {},
          settings: DEFAULT_SETTINGS,
          pantry: DEFAULT_PANTRY,
          excludedFoods: [],
        };

    const currentShoppingLists = payload.shoppingLists || {};
    const weekList = currentShoppingLists[weekStartDate] || [];

    const { updatedList, addedCount } = mergeImportedItemsIntoShoppingList(weekList, parsedItems);

    payload.shoppingLists = {
      ...currentShoppingLists,
      [weekStartDate]: updatedList,
    };
    payload.updatedAt = new Date().toISOString();
    payload.deviceId = 'apple_shortcuts_webhook';

    const saved = await saveCloudFamilyData(payload);

    if (!saved) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se pudo guardar la lista de la compra en el servidor.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${addedCount} producto(s) añadidos a la lista de la compra`,
      addedCount,
      weekStartDate,
      importedItems: parsedItems.map((item) => ({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        commercialFormat: item.commercialFormat,
      })),
      totalWeekItems: updatedList.length,
    });
  } catch (error: any) {
    console.error('Error en POST /api/reminders/import:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error interno al procesar la importación de Recordatorios',
      },
      { status: 500 }
    );
  }
}
