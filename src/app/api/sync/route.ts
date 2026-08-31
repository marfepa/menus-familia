import { NextResponse } from 'next/server';
import { getCloudFamilyData, saveCloudFamilyData } from '@/lib/cloudStore';
import type { FamilySyncPayload } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rawData = await getCloudFamilyData();
    if (!rawData) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    const data: FamilySyncPayload = {
      version: rawData.version || 1,
      updatedAt: rawData.updatedAt || new Date().toISOString(),
      deviceId: rawData.deviceId,
      recipes: Array.isArray(rawData.recipes) ? rawData.recipes : [],
      plans: rawData.plans && typeof rawData.plans === 'object' ? rawData.plans : {},
      shoppingLists: rawData.shoppingLists && typeof rawData.shoppingLists === 'object' ? rawData.shoppingLists : {},
      settings: rawData.settings && typeof rawData.settings === 'object' ? rawData.settings : { householdServings: 4, generateMode: 'full' },
      pantry: Array.isArray(rawData.pantry) ? rawData.pantry : [],
      excludedFoods: Array.isArray(rawData.excludedFoods) ? rawData.excludedFoods : [],
    };

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error en GET /api/sync:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener datos compartidos' },
      { status: 500 }
    );
  }
}


export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<FamilySyncPayload>;

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Cuerpo de la petición inválido' },
        { status: 400 }
      );
    }

    const payload: FamilySyncPayload = {
      version: body.version || 1,
      updatedAt: body.updatedAt || new Date().toISOString(),
      deviceId: body.deviceId,
      recipes: Array.isArray(body.recipes) ? body.recipes : [],
      plans: body.plans && typeof body.plans === 'object' ? body.plans : {},
      shoppingLists: body.shoppingLists && typeof body.shoppingLists === 'object' ? body.shoppingLists : {},
      settings: body.settings || { householdServings: 4, generateMode: 'full' },
      pantry: Array.isArray(body.pantry) ? body.pantry : [],
      excludedFoods: Array.isArray(body.excludedFoods) ? body.excludedFoods : [],
    };

    const saved = await saveCloudFamilyData(payload);

    if (!saved) {
      return NextResponse.json(
        { success: false, error: 'No se pudo persistir el estado' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updatedAt: payload.updatedAt,
    });
  } catch (error) {
    console.error('Error en POST /api/sync:', error);
    return NextResponse.json(
      { success: false, error: 'Error al sincronizar datos' },
      { status: 500 }
    );
  }
}
