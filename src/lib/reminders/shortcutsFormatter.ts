import type { ShoppingItem } from '@/types';

/**
 * Formatea la lista de productos para importar o pegar directamente en Recordatorios de Apple.
 * Apple Reminders crea un recordatorio individual por cada salto de línea al pegar.
 */
export function formatRemindersPlainText(items: ShoppingItem[], onlyUnchecked = true): string {
  const targetItems = onlyUnchecked ? items.filter((it) => !it.checked) : items;

  return targetItems
    .map((item) => {
      let line = item.name;
      if (item.commercialFormat) {
        line += ` (${item.commercialFormat})`;
      } else if (item.quantity && item.unit) {
        line += ` (${item.quantity} ${item.unit})`;
      }

      const notes: string[] = [];
      if (item.storeTip) {
        notes.push(`📍 ${item.storeTip}`);
      }
      if (item.recipeUsageNote) {
        notes.push(item.recipeUsageNote);
      }

      if (notes.length > 0) {
        line += ` — ${notes.join(' · ')}`;
      }

      return line;
    })
    .join('\n');
}

/**
 * Formato estructurado para Atajos de Apple con separador de título y notas.
 */
export function formatRemindersForShortcut(items: ShoppingItem[], onlyUnchecked = true): string {
  const targetItems = onlyUnchecked ? items.filter((it) => !it.checked) : items;

  return targetItems
    .map((item) => {
      let title = item.name;
      if (item.commercialFormat) {
        title += ` · ${item.commercialFormat}`;
      } else if (item.quantity && item.unit) {
        title += ` (${item.quantity} ${item.unit})`;
      }

      const notes: string[] = [];
      if (item.storeTip) {
        notes.push(`Pasillo: ${item.storeTip}`);
      }
      if (item.recipeUsageNote) {
        notes.push(item.recipeUsageNote);
      }
      if (item.recipeSource && item.recipeSource.length > 0) {
        notes.push(`Recetas: ${item.recipeSource.join(', ')}`);
      }

      const notesStr = notes.length > 0 ? notes.join(' | ') : '';
      return `${title}:::${notesStr}`;
    })
    .join('\n');
}

/**
 * Genera el enlace URI scheme para ejecutar el atajo nativo de Apple.
 */
export function buildShortcutsUrl(
  shortcutName = 'Menús a Recordatorios',
  items: ShoppingItem[],
  onlyUnchecked = true
): string {
  const textPayload = formatRemindersPlainText(items, onlyUnchecked);
  const encodedName = encodeURIComponent(shortcutName);
  const encodedText = encodeURIComponent(textPayload);
  return `shortcuts://run-shortcut?name=${encodedName}&input=text&text=${encodedText}`;
}

/**
 * Genera un archivo iCalendar .ics descargable con componentes VTODO para importación local.
 */
export function generateRemindersIcsFile(items: ShoppingItem[], onlyUnchecked = true): string {
  const targetItems = onlyUnchecked ? items.filter((it) => !it.checked) : items;
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const vtodos = targetItems.map((item) => {
    const uid = `menu-${item.id.replace(/[^a-zA-Z0-9_-]/g, '_')}-${Date.now()}`;
    let summary = item.name;
    if (item.commercialFormat) {
      summary += ` (${item.commercialFormat})`;
    }

    const description = [
      item.storeTip ? `📍 ${item.storeTip}` : '',
      item.recipeUsageNote ? `ℹ️ ${item.recipeUsageNote}` : '',
      item.recipeSource?.length ? `🥑 Recetas: ${item.recipeSource.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join('\\n');

    return [
      'BEGIN:VTODO',
      `UID:${uid}`,
      `SUMMARY:${summary.replace(/,/g, '\\,').replace(/;/g, '\\;')}`,
      description ? `DESCRIPTION:${description}` : '',
      'STATUS:NEEDS-ACTION',
      `CREATED:${now}`,
      `DTSTAMP:${now}`,
      'END:VTODO',
    ]
      .filter(Boolean)
      .join('\r\n');
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Menus Familia//Apple Reminders//ES',
    'CALSCALE:GREGORIAN',
    ...vtodos,
    'END:VCALENDAR',
  ].join('\r\n');
}
