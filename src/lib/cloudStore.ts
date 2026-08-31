import type { FamilySyncPayload, CloudStoreStatus } from '@/types';
import fs from 'fs';
import path from 'path';

const REDIS_KEY = 'family_menu_state_v1';
const LOCAL_DATA_FILE = path.join(process.cwd(), 'data', 'family_data.json');

function getUpstashCredentials() {
  const url =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.REDIS_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_KV_URL ||
    process.env.UPSTASH_REST_API_URL;
  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.REDIS_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_KV_TOKEN ||
    process.env.UPSTASH_REST_API_TOKEN;
  return { url, token, isConfigured: Boolean(url && token) };
}


/**
 * Lee el estado familiar desde la nube (Upstash/Vercel KV) o desde el archivo local en desarrollo.
 */
export async function getCloudFamilyData(): Promise<FamilySyncPayload | null> {
  const { url, token, isConfigured } = getUpstashCredentials();

  if (isConfigured && url && token) {
    try {
      const endpoint = `${url.replace(/\/$/, '')}/get/${REDIS_KEY}`;
      const res = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      });

      if (!res.ok) {
        console.error('Error HTTP al consultar Upstash/Vercel KV:', res.status, res.statusText);
        return null;
      }

      const data = (await res.json()) as { result: string | null };
      if (!data.result) return null;

      const parsed: FamilySyncPayload = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
      return parsed;
    } catch (err) {
      console.error('Error al leer de Upstash/Vercel KV:', err);
      return null;
    }
  }

  // Fallback para desarrollo local: leer desde archivo en disco data/family_data.json
  try {
    if (fs.existsSync(LOCAL_DATA_FILE)) {
      const raw = fs.readFileSync(LOCAL_DATA_FILE, 'utf-8');
      return JSON.parse(raw) as FamilySyncPayload;
    }
  } catch (err) {
    console.error('Error al leer archivo local de datos:', err);
  }

  return null;
}

/**
 * Guarda el estado familiar en la nube (Upstash/Vercel KV) o en el archivo local en desarrollo.
 */
export async function saveCloudFamilyData(payload: FamilySyncPayload): Promise<boolean> {
  const { url, token, isConfigured } = getUpstashCredentials();

  if (isConfigured && url && token) {
    try {
      const endpoint = `${url.replace(/\/$/, '')}/set/${REDIS_KEY}`;
      const stringified = JSON.stringify(payload);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stringified),
      });

      if (!res.ok) {
        console.error('Error HTTP al guardar en Upstash/Vercel KV:', res.status, res.statusText);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error al guardar en Upstash/Vercel KV:', err);
      return false;
    }
  }

  // Fallback para desarrollo local: guardar en archivo en disco data/family_data.json
  try {
    const dir = path.dirname(LOCAL_DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error al guardar en archivo local de datos:', err);
    return false;
  }
}

/**
 * Comprueba el estado del proveedor de almacenamiento.
 */
export async function getStoreStatus(): Promise<CloudStoreStatus> {
  const { isConfigured } = getUpstashCredentials();

  if (isConfigured) {
    const cloudData = await getCloudFamilyData();
    return {
      configured: true,
      provider: 'upstash',
      lastUpdated: cloudData?.updatedAt,
      message: 'Conectado a Vercel KV / Upstash Redis',
    };
  }

  // En local sin variables de entorno
  let hasLocalFile = false;
  try {
    hasLocalFile = fs.existsSync(LOCAL_DATA_FILE);
  } catch {
    hasLocalFile = false;
  }

  return {
    configured: false,
    provider: hasLocalFile ? 'local_file' : 'unconfigured',
    message: hasLocalFile
      ? 'Modo local: Guardando en archivo local data/family_data.json'
      : 'Modo local: Sin base de datos en la nube configurada',
  };
}
