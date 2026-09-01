import type {
  ShoppingItem,
  AppleRemindersListInfo,
  RemindersSyncResult,
} from '@/types';

export interface ICloudCredentials {
  appleId: string;
  appSpecificPassword: string;
}

export function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

export function unescapeIcsText(text: string): string {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

export function formatIcsDate(date: Date = new Date()): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Genera el título para el recordatorio en Apple Reminders.
 */
export function buildReminderSummary(item: ShoppingItem): string {
  if (item.commercialFormat) {
    return `${item.name} · ${item.commercialFormat}`;
  }
  if (item.quantity && item.unit) {
    return `${item.name} (${item.quantity} ${item.unit})`;
  }
  return item.name;
}

/**
 * Genera las notas detalladas / descripción para el recordatorio de Apple.
 */
export function buildReminderDescription(item: ShoppingItem): string {
  const parts: string[] = [];

  if (item.commercialFormat) {
    parts.push(`🛒 Formato compra: ${item.commercialFormat}`);
  }
  if (item.recipeUsageNote) {
    parts.push(`ℹ️ ${item.recipeUsageNote}`);
  }
  if (item.storeTip) {
    parts.push(`📍 Ubicación: ${item.storeTip}`);
  }
  if (item.recipeSource && item.recipeSource.length > 0) {
    parts.push(`🥑 Recetas: ${item.recipeSource.join(', ')}`);
  }

  parts.push('— Sincronizado desde Menús Familia');
  return parts.join('\n');
}

/**
 * Genera el archivo iCalendar VTODO (RFC 5545).
 */
export function generateVTodoIcs(item: ShoppingItem, customUid?: string): string {
  const uid = customUid || `menu-${item.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  const now = formatIcsDate();
  const summary = escapeIcsText(buildReminderSummary(item));
  const description = escapeIcsText(buildReminderDescription(item));
  const status = item.checked ? 'COMPLETED' : 'NEEDS-ACTION';
  const completedLine = item.checked ? `COMPLETED:${now}\nPERCENT-COMPLETE:100\n` : 'PERCENT-COMPLETE:0\n';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Menus Familia//Apple Reminders Sync//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VTODO',
    `UID:${uid}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `STATUS:${status}`,
    completedLine.trimEnd(),
    `CREATED:${now}`,
    `DTSTAMP:${now}`,
    `LAST-MODIFIED:${now}`,
    'END:VTODO',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Extrae texto de etiquetas XML sencillas ignorando prefijos de namespace.
 */
export function extractTagContent(xml: string, tagName: string): string[] {
  const regex = new RegExp(`<(?:[a-zA-Z0-9_-]+:)?${tagName}(?:\\s+[^>]*)?>([\\s\\S]*?)<\\/(?:[a-zA-Z0-9_-]+:)?${tagName}>`, 'gi');
  const matches: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(xml)) !== null) {
    matches.push(m[1].trim());
  }
  return matches;
}

/**
 * Extrae bloques <response> de respuestas WebDAV.
 */
export function extractResponses(xml: string): string[] {
  const regex = /<(?:[a-zA-Z0-9_-]+:)?response(?:[\s\S]*?)>([\s\S]*?)<\/(?:[a-zA-Z0-9_-]+:)?response>/gi;
  const responses: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(xml)) !== null) {
    responses.push(m[1]);
  }
  return responses;
}

export function parseRemindersListsFromXml(xml: string, baseUrl: string): AppleRemindersListInfo[] {
  const responses = extractResponses(xml);
  const lists: AppleRemindersListInfo[] = [];

  for (const resp of responses) {
    // Comprobar si soporta VTODO
    const supportsVTodo =
      /comp\s+name=["']VTODO["']/i.test(resp) ||
      /<(?:[a-zA-Z0-9_-]+:)?comp-filter[^>]*name=["']VTODO["']/i.test(resp) ||
      resp.includes('VTODO');

    // Comprobar si es un calendario/colección
    const isCalendar = /resourcetype[^>]*>[\s\S]*?calendar[\s\S]*?<\/resourcetype/i.test(resp) ||
      resp.includes('calendar') ||
      supportsVTodo;

    if (!supportsVTodo && !isCalendar) continue;

    // Extraer href
    const hrefMatches = extractTagContent(resp, 'href');
    if (hrefMatches.length === 0) continue;
    const href = hrefMatches[0];

    // Extraer displayname
    const nameMatches = extractTagContent(resp, 'displayname');
    const name = nameMatches.length > 0 ? nameMatches[0] : 'Recordatorios';

    // Omitir calendarios sin nombre o el home set raíz
    if (!name || name === 'calendars' || href.endsWith('/calendars/')) continue;

    // Solo colecciones que soportan VTODO (o que tienen nombres típicos de recordatorios)
    if (!supportsVTodo && !/recordatorio|reminder|compra|task|tarea/i.test(name)) {
      continue;
    }

    // Extraer color si existe
    const colorMatches = extractTagContent(resp, 'calendar-color');
    const color = colorMatches.length > 0 ? colorMatches[0] : undefined;

    const fullHref = href.startsWith('http') ? href : new URL(href, baseUrl).toString();

    // Determinar si es la lista predeterminada o de compras
    const isDefault = /compra|shopping|groceries|recordatorio|reminder/i.test(name);

    lists.push({
      id: href,
      href: fullHref,
      name,
      color,
      isDefault,
    });
  }

  // Ordenar poniendo primero las listas de compra o predeterminadas
  return lists.sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return a.name.localeCompare(b.name, 'es');
  });
}

/**
 * Cliente CalDAV para iCloud.
 */
export class ICloudCalDavClient {
  private credentials: ICloudCredentials;
  private authHeader: string;
  private currentOrigin = 'https://caldav.icloud.com';

  constructor(credentials: ICloudCredentials) {
    this.credentials = credentials;
    const cleanId = credentials.appleId.trim();
    // Limpiar espacios y guiones si los hubiera en la contraseña específica de app
    const cleanPass = credentials.appSpecificPassword.trim().replace(/\s+/g, '');
    const token = Buffer.from(`${cleanId}:${cleanPass}`).toString('base64');
    this.authHeader = `Basic ${token}`;
  }

  private async request(
    urlStr: string,
    method: string,
    body?: string,
    headers: Record<string, string> = {}
  ): Promise<{ status: number; text: string; finalUrl: string; ok: boolean }> {
    const finalHeaders = {
      Authorization: this.authHeader,
      ...headers,
    };

    const targetUrl = urlStr.startsWith('http') ? urlStr : new URL(urlStr, this.currentOrigin).toString();

    const res = await fetch(targetUrl, {
      method,
      headers: finalHeaders,
      body,
      redirect: 'follow',
      cache: 'no-store',
    });

    if (res.url) {
      try {
        const u = new URL(res.url);
        this.currentOrigin = u.origin;
      } catch {}
    }

    const text = await res.text();
    return {
      status: res.status,
      text,
      finalUrl: res.url || targetUrl,
      ok: res.ok || res.status === 207,
    };
  }

  /**
   * Autodescubre el principal y calendar-home-set de iCloud y devuelve las listas de Recordatorios.
   */
  async discoverRemindersLists(): Promise<AppleRemindersListInfo[]> {
    // 1. PROPFIND en raíz
    const rootBody = `<?xml version="1.0" encoding="utf-8" ?>
<d:propfind xmlns:d="DAV:">
  <d:prop>
    <d:current-user-principal />
  </d:prop>
</d:propfind>`;

    const rootRes = await this.request('https://caldav.icloud.com/', 'PROPFIND', rootBody, {
      Depth: '0',
      'Content-Type': 'application/xml; charset=utf-8',
    });

    if (!rootRes.ok && rootRes.status !== 207) {
      if (rootRes.status === 401 || rootRes.status === 403) {
        throw new Error('Credenciales de Apple ID o contraseña de app incorrectas');
      }
      throw new Error(`Error de conexión con iCloud CalDAV (${rootRes.status})`);
    }

    const principalHrefs = extractTagContent(rootRes.text, 'href');
    if (principalHrefs.length === 0) {
      throw new Error('No se pudo localizar el usuario principal en iCloud');
    }

    const principalHref = principalHrefs[0];
    const principalUrl = new URL(principalHref, rootRes.finalUrl).toString();

    // 2. PROPFIND en principal para obtener calendar-home-set
    const principalBody = `<?xml version="1.0" encoding="utf-8" ?>
<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <c:calendar-home-set />
  </d:prop>
</d:propfind>`;

    const homeRes = await this.request(principalUrl, 'PROPFIND', principalBody, {
      Depth: '0',
      'Content-Type': 'application/xml; charset=utf-8',
    });

    if (!homeRes.ok) {
      throw new Error('No se pudo obtener el conjunto de calendarios de iCloud');
    }

    const homeHrefs = extractTagContent(homeRes.text, 'href');
    if (homeHrefs.length === 0) {
      throw new Error('No se encontró la ruta de colecciones de iCloud');
    }

    const homeHref = homeHrefs[0];
    const homeUrl = new URL(homeHref, homeRes.finalUrl).toString();

    // 3. PROPFIND Depth: 1 en calendar-home-set para descubrir listas
    const listsBody = `<?xml version="1.0" encoding="utf-8" ?>
<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav" xmlns:apple="http://apple.com/ns/ical/">
  <d:prop>
    <d:displayname />
    <d:resourcetype />
    <c:supported-calendar-component-set />
    <apple:calendar-color />
    <apple:calendar-order />
  </d:prop>
</d:propfind>`;

    const listsRes = await this.request(homeUrl, 'PROPFIND', listsBody, {
      Depth: '1',
      'Content-Type': 'application/xml; charset=utf-8',
    });

    if (!listsRes.ok && listsRes.status !== 207) {
      throw new Error('Error al listar las colecciones de Recordatorios');
    }

    const parsedLists = parseRemindersListsFromXml(listsRes.text, homeRes.finalUrl);
    return parsedLists;
  }

  /**
   * Sube o actualiza un recordatorio individual en una lista.
   */
  async putReminder(calendarUrl: string, item: ShoppingItem): Promise<boolean> {
    const cleanId = `menu-${item.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    const vtodo = generateVTodoIcs(item, cleanId);

    const base = calendarUrl.endsWith('/') ? calendarUrl : `${calendarUrl}/`;
    const itemUrl = `${base}${cleanId}.ics`;

    const res = await this.request(itemUrl, 'PUT', vtodo, {
      'Content-Type': 'text/calendar; charset=utf-8',
    });

    return res.ok || res.status === 201 || res.status === 204 || res.status === 200;
  }

  /**
   * Sincroniza una lista de productos de la compra con la lista elegida en iCloud.
   */
  async syncShoppingList(
    calendarUrl: string,
    items: ShoppingItem[]
  ): Promise<RemindersSyncResult> {
    let syncedCount = 0;
    const errors: string[] = [];

    for (const item of items) {
      try {
        const ok = await this.putReminder(calendarUrl, item);
        if (ok) {
          syncedCount++;
        } else {
          errors.push(`Error al subir ${item.name}`);
        }
      } catch (err: any) {
        errors.push(`Error en ${item.name}: ${err.message || err}`);
      }
    }

    return {
      success: errors.length === 0 || syncedCount > 0,
      syncedCount,
      totalCount: items.length,
      listName: calendarUrl,
      timestamp: new Date().toISOString(),
      error: errors.length > 0 ? errors.slice(0, 3).join('; ') : undefined,
    };
  }
}
