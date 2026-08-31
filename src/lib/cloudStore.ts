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
      const baseUrl = url.replace(/\/$/, '');
      let rawResult: unknown = null;

      // Intentar primero endpoint estándar GET /get/KEY
      const res = await fetch(`${baseUrl}/get/${REDIS_KEY}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      });

      if (res.ok) {
        const json = (await res.json()) as { result?: unknown };
        rawResult = json.result;
      } else {
        // Fallback endpoint POST ['GET', KEY]
        const postRes = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(['GET', REDIS_KEY]),
          cache: 'no-store',
        });
        if (postRes.ok) {
          const json = (await postRes.json()) as { result?: unknown };
          rawResult = json.result;
        }
      }

      if (!rawResult) return null;

      let parsed: any = rawResult;
      // Desenvolver de forma segura en caso de codificación JSON anidada
      while (typeof parsed === 'string') {
        try {
          parsed = JSON.parse(parsed);
        } catch {
          break;
        }
      }

      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as FamilySyncPayload;
      }

      return null;
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
      const baseUrl = url.replace(/\/$/, '');
      const stringifiedPayload = JSON.stringify(payload);

      // Guardar con comando estándar Upstash POST ['SET', KEY, VALUE]
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['SET', REDIS_KEY, stringifiedPayload]),
      });

      if (!res.ok) {
        // Fallback a endpoint /set/:key
        const fallbackRes = await fetch(`${baseUrl}/set/${REDIS_KEY}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: stringifiedPayload,
        });

        if (!fallbackRes.ok) {
          console.error('Error HTTP al guardar en Upstash/Vercel KV:', fallbackRes.status, fallbackRes.statusText);
          return false;
        }
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
