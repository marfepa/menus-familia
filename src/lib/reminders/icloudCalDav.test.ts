import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeIcsText,
  unescapeIcsText,
  formatIcsDate,
  buildReminderSummary,
  buildReminderDescription,
  generateVTodoIcs,
  extractResponses,
  parseRemindersListsFromXml,
} from '@/lib/reminders/icloudCalDav';
import type { ShoppingItem } from '@/types';

describe('icloudCalDav and iCalendar generators', () => {
  it('escapes and unescapes iCalendar text and formats UTC dates', () => {
    const original = 'Plátanos, manzanas; peras & más\nSegunda línea\\barra';
    const escaped = escapeIcsText(original);
    assert.equal(escaped.includes('\n'), false);
    assert.equal(escaped.includes('\\n'), true);
    assert.equal(escaped.includes('\\,'), true);
    assert.equal(escaped.includes('\\;'), true);

    const unescaped = unescapeIcsText(escaped);
    assert.equal(unescaped, original);

    const formattedDate = formatIcsDate(new Date('2026-09-01T14:30:00.000Z'));
    assert.equal(formattedDate, '20260901T143000Z');
  });

  it('formats reminder summary and detailed description', () => {
    const item: ShoppingItem = {
      id: 'item-pollo',
      name: 'Pechuga de pollo',
      commercialFormat: '1 Bandeja (~500g)',
      quantity: 1,
      unit: 'Bandeja',
      category: 'carniceria',
      checked: false,
      recipeSource: ['Pollo al curry', 'Fajitas'],
      recipeUsageNote: 'Recetas usan: 400g en 2 recetas',
      storeTip: 'Mural carnicería',
      period: 'weekday',
    };

    const summary = buildReminderSummary(item);
    assert.equal(summary, 'Pechuga de pollo · 1 Bandeja (~500g)');

    const desc = buildReminderDescription(item);
    assert.ok(desc.includes('1 Bandeja (~500g)'));
    assert.ok(desc.includes('Pollo al curry, Fajitas'));
    assert.ok(desc.includes('Mural carnicería'));
    assert.ok(desc.includes('Menús Familia'));
  });

  it('generates valid RFC 5545 VTODO component for completed and pending items', () => {
    const item: ShoppingItem = {
      id: 'item-patatas',
      name: 'Patatas para guisar',
      commercialFormat: '1 Malla (2kg)',
      category: 'fruteria',
      checked: true,
    };

    const ics = generateVTodoIcs(item, 'test-uid-123');
    assert.ok(ics.startsWith('BEGIN:VCALENDAR'));
    assert.ok(ics.includes('BEGIN:VTODO'));
    assert.ok(ics.includes('UID:test-uid-123'));
    assert.ok(ics.includes('SUMMARY:Patatas para guisar · 1 Malla (2kg)'));
    assert.ok(ics.includes('STATUS:COMPLETED'));
    assert.ok(ics.includes('COMPLETED:'));
    assert.ok(ics.includes('PERCENT-COMPLETE:100'));
    assert.ok(ics.endsWith('END:VCALENDAR'));
  });

  it('parses WebDAV multi-status XML and extracts VTODO Reminders lists accurately', () => {
    const mockXml = `<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav" xmlns:apple="http://apple.com/ns/ical/">
  <d:response>
    <d:href>/12345678/calendars/tasks/</d:href>
    <d:propstat>
      <d:prop>
        <d:displayname>Compra</d:displayname>
        <d:resourcetype>
          <d:collection/>
          <c:calendar/>
        </d:resourcetype>
        <c:supported-calendar-component-set>
          <c:comp name="VTODO"/>
        </c:supported-calendar-component-set>
        <apple:calendar-color>#34C759</apple:calendar-color>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
  <d:response>
    <d:href>/12345678/calendars/work/</d:href>
    <d:propstat>
      <d:prop>
        <d:displayname>Eventos Trabajo</d:displayname>
        <d:resourcetype>
          <d:collection/>
          <c:calendar/>
        </d:resourcetype>
        <c:supported-calendar-component-set>
          <c:comp name="VEVENT"/>
        </c:supported-calendar-component-set>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
  <d:response>
    <d:href>/12345678/calendars/reminders/</d:href>
    <d:propstat>
      <d:prop>
        <d:displayname>Recordatorios</d:displayname>
        <d:resourcetype>
          <d:collection/>
          <c:calendar/>
        </d:resourcetype>
        <c:supported-calendar-component-set>
          <c:comp name="VTODO"/>
        </c:supported-calendar-component-set>
        <apple:calendar-color>#FF9500</apple:calendar-color>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
</d:multistatus>`;

    const responses = extractResponses(mockXml);
    assert.equal(responses.length, 3);

    const lists = parseRemindersListsFromXml(mockXml, 'https://p123-caldav.icloud.com');
    assert.equal(lists.length, 2); // Only Compra and Recordatorios (VTODO), Eventos Trabajo is VEVENT only!

    assert.equal(lists[0].name, 'Compra');
    assert.equal(lists[0].href, 'https://p123-caldav.icloud.com/12345678/calendars/tasks/');
    assert.equal(lists[0].color, '#34C759');
    assert.equal(lists[0].isDefault, true);

    assert.equal(lists[1].name, 'Recordatorios');
    assert.equal(lists[1].href, 'https://p123-caldav.icloud.com/12345678/calendars/reminders/');
    assert.equal(lists[1].color, '#FF9500');
  });
});
