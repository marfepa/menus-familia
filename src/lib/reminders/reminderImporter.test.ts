import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  inferCategory,
  inferDefaultPackageFormat,
  parseSingleReminderText,
  parseRemindersPayload,
  mergeImportedItemsIntoShoppingList,
} from '@/lib/reminders/reminderImporter';
import type { ShoppingItem } from '@/types';

describe('reminderImporter', () => {
  it('inferCategory asigna pasillos correctamente para todas las secciones del supermercado', () => {
    // 1. Pescadería
    assert.strictEqual(inferCategory('Salmón noruego fresco'), 'pescaderia');
    assert.strictEqual(inferCategory('Lomos de merluza limpia'), 'pescaderia');
    assert.strictEqual(inferCategory('Dorada abierta para horno'), 'pescaderia');
    assert.strictEqual(inferCategory('Gambas peladas'), 'pescaderia');
    assert.strictEqual(inferCategory('Calamares en anillas'), 'pescaderia');
    assert.strictEqual(inferCategory('Sepia limpia'), 'pescaderia');
    assert.strictEqual(inferCategory('Pulpo cocido'), 'pescaderia');
    assert.strictEqual(inferCategory('Almejas frescas'), 'pescaderia');
    assert.strictEqual(inferCategory('Gulas del norte'), 'pescaderia');
    assert.strictEqual(inferCategory('Bonito fresco en dados'), 'pescaderia');

    // 2. Carnicería y embutidos
    assert.strictEqual(inferCategory('Pechuga de pollo fileteada'), 'carniceria');
    assert.strictEqual(inferCategory('Carne picada de ternera'), 'carniceria');
    assert.strictEqual(inferCategory('Cinta de lomo de cerdo'), 'carniceria');
    assert.strictEqual(inferCategory('Solomillo de pavo'), 'carniceria');
    assert.strictEqual(inferCategory('Hamburguesas de vacuno'), 'carniceria');
    assert.strictEqual(inferCategory('Chuletillas de cordero'), 'carniceria');
    assert.strictEqual(inferCategory('Jamón serrano en lonchas'), 'carniceria');
    assert.strictEqual(inferCategory('Jamón york dulce'), 'carniceria');
    assert.strictEqual(inferCategory('Bacon ahumado'), 'carniceria');
    assert.strictEqual(inferCategory('Chorizo dulce'), 'carniceria');
    assert.strictEqual(inferCategory('Fuet espetec'), 'carniceria');
    assert.strictEqual(inferCategory('Taquitos de jamón ibérico'), 'carniceria');

    // 3. Lácteos y huevos
    assert.strictEqual(inferCategory('Leche semidesnatada'), 'lacteos');
    assert.strictEqual(inferCategory('Bebida de avena'), 'lacteos');
    assert.strictEqual(inferCategory('Huevos camperos clase L'), 'lacteos');
    assert.strictEqual(inferCategory('Claras de huevo pasteurizadas'), 'lacteos');
    assert.strictEqual(inferCategory('Yogur griego natural'), 'lacteos');
    assert.strictEqual(inferCategory('Kéfir natural'), 'lacteos');
    assert.strictEqual(inferCategory('Queso mozzarella rallado'), 'lacteos');
    assert.strictEqual(inferCategory('Queso feta en salmuera'), 'lacteos');
    assert.strictEqual(inferCategory('Queso fresco tipo Burgos'), 'lacteos');
    assert.strictEqual(inferCategory('Queso crema para untar'), 'lacteos');
    assert.strictEqual(inferCategory('Mantequilla tradicional'), 'lacteos');
    assert.strictEqual(inferCategory('Nata para cocinar'), 'lacteos');

    // 4. Frutería y verduras
    assert.strictEqual(inferCategory('Plátanos de Canarias'), 'fruteria');
    assert.strictEqual(inferCategory('Manzanas Fuji'), 'fruteria');
    assert.strictEqual(inferCategory('Mandarinas clementinas'), 'fruteria');
    assert.strictEqual(inferCategory('Aguacates al punto'), 'fruteria');
    assert.strictEqual(inferCategory('Tomates pera'), 'fruteria');
    assert.strictEqual(inferCategory('Tomates cherry rama'), 'fruteria');
    assert.strictEqual(inferCategory('Lechuga romana'), 'fruteria');
    assert.strictEqual(inferCategory('Espinacas tiernas baby'), 'fruteria');
    assert.strictEqual(inferCategory('Calabacines verdes'), 'fruteria');
    assert.strictEqual(inferCategory('Berenjenas'), 'fruteria');
    assert.strictEqual(inferCategory('Pimientos tricolor'), 'fruteria');
    assert.strictEqual(inferCategory('Cebollas dulces'), 'fruteria');
    assert.strictEqual(inferCategory('Patatas para guisar'), 'fruteria');
    assert.strictEqual(inferCategory('Zanahorias'), 'fruteria');
    assert.strictEqual(inferCategory('Brócoli fresco'), 'fruteria');
    assert.strictEqual(inferCategory('Champiñones laminados'), 'fruteria');
    assert.strictEqual(inferCategory('Perejil fresco'), 'fruteria');
    assert.strictEqual(inferCategory('Malla de ajos'), 'fruteria');

    // 5. Panadería y desayunos
    assert.strictEqual(inferCategory('Barra de pan rústico'), 'panaderia');
    assert.strictEqual(inferCategory('Pan de molde 100% integral'), 'panaderia');
    assert.strictEqual(inferCategory('Pan de hamburguesa'), 'panaderia');
    assert.strictEqual(inferCategory('Pan de hamburguesa con sésamo'), 'panaderia');
    assert.strictEqual(inferCategory('Bocadillo'), 'panaderia');
    assert.strictEqual(inferCategory('Bocata de jamón'), 'panaderia');
    assert.strictEqual(inferCategory('Sandwich mixto'), 'panaderia');
    assert.strictEqual(inferCategory('Croissants de mantequilla'), 'panaderia');
    assert.strictEqual(inferCategory('Galletas Digestive'), 'panaderia');
    assert.strictEqual(inferCategory('Copos de avena integrales'), 'panaderia');
    assert.strictEqual(inferCategory('Tortillas de trigo para fajitas'), 'panaderia');
    assert.strictEqual(inferCategory('Masa de pizza fresca'), 'panaderia');
    assert.strictEqual(inferCategory('Picos rústicos'), 'panaderia');
    assert.strictEqual(inferCategory('Magdalenas caseras'), 'panaderia');

    // 6. Congelados
    assert.strictEqual(inferCategory('Pizza congelada cuatro quesos'), 'congelados');
    assert.strictEqual(inferCategory('Tarrina de helado de chocolate'), 'congelados');
    assert.strictEqual(inferCategory('Bolsa de cubitos de hielo'), 'congelados');
    assert.strictEqual(inferCategory('Varitas de merluza ultracongeladas'), 'congelados');
    assert.strictEqual(inferCategory('Nuggets de pollo congelados'), 'congelados');
    assert.strictEqual(inferCategory('Guisantes congelados'), 'congelados');
    assert.strictEqual(inferCategory('Croquetas de jamón congeladas'), 'congelados');

    // 7. Despensa, pastas, legumbres, salsas y especias
    assert.strictEqual(inferCategory('Arroz basmati'), 'despensa');
    assert.strictEqual(inferCategory('Macarrones plumas'), 'despensa');
    assert.strictEqual(inferCategory('Espaguetis integrales'), 'despensa');
    assert.strictEqual(inferCategory('Lentejas pardinas'), 'despensa');
    assert.strictEqual(inferCategory('Garbanzos cocidos en tarro'), 'despensa');
    assert.strictEqual(inferCategory('Aceite de oliva virgen extra'), 'despensa');
    assert.strictEqual(inferCategory('Vinagre de Módena'), 'despensa');
    assert.strictEqual(inferCategory('Tomate frito casero'), 'despensa');
    assert.strictEqual(inferCategory('Tomate triturado natural'), 'despensa');
    assert.strictEqual(inferCategory('Atún claro en aceite de oliva'), 'despensa');
    assert.strictEqual(inferCategory('Mayonesa clásica'), 'despensa');
    assert.strictEqual(inferCategory('Salsa de soja tamari'), 'despensa');
    assert.strictEqual(inferCategory('Café molido natural'), 'despensa');
    assert.strictEqual(inferCategory('Té verde con hierbabuena'), 'despensa');
    assert.strictEqual(inferCategory('Cacao puro en polvo'), 'despensa');
    assert.strictEqual(inferCategory('Chocolate negro 85%'), 'despensa');
    assert.strictEqual(inferCategory('Nueces peladas'), 'despensa');
    assert.strictEqual(inferCategory('Pimentón dulce de la Vera'), 'despensa');
    assert.strictEqual(inferCategory('Orégano seco'), 'despensa');
    assert.strictEqual(inferCategory('Sal fina marina'), 'despensa');

    // 8. Otros, limpieza y droguería
    assert.strictEqual(inferCategory('Papel higiénico 3 capas'), 'otros');
    assert.strictEqual(inferCategory('Papel de cocina absorbente'), 'otros');
    assert.strictEqual(inferCategory('Detergente para lavadora'), 'otros');
    assert.strictEqual(inferCategory('Suavizante concentrado'), 'otros');
    assert.strictEqual(inferCategory('Lavavajillas a mano Fairy'), 'otros');
    assert.strictEqual(inferCategory('Pastillas para el lavavajillas'), 'otros');
    assert.strictEqual(inferCategory('Lejía desinfectante'), 'otros');
    assert.strictEqual(inferCategory('Gel de ducha familiar'), 'otros');
    assert.strictEqual(inferCategory('Champú anticaída'), 'otros');
    assert.strictEqual(inferCategory('Pasta de dientes fluor'), 'otros');
    assert.strictEqual(inferCategory('Pañales talla 4'), 'otros');
    assert.strictEqual(inferCategory('Toallitas de bebé'), 'otros');
    assert.strictEqual(inferCategory('Pienso para perro'), 'otros');
    assert.strictEqual(inferCategory('Bolsas de basura 30L'), 'otros');
    assert.strictEqual(inferCategory('Pilas alcalinas AA'), 'otros');

    // Fallback a otros
    assert.strictEqual(inferCategory('Articulo Desconocido X999'), 'otros');
  });

  it('desambigua correctamente reglas contextuales prioritarias', () => {
    // Caldos van a despensa aunque mencionen carne o verduras
    assert.strictEqual(inferCategory('Caldo de pollo suave'), 'despensa');
    assert.strictEqual(inferCategory('Caldo de pescado y marisco'), 'despensa');
    assert.strictEqual(inferCategory('Caldo de verduras'), 'despensa');
    assert.strictEqual(inferCategory('Pastillas de caldo de carne'), 'despensa');

    // Atún y pescados en lata van a despensa vs fresco a pescadería
    assert.strictEqual(inferCategory('Atún en lata'), 'despensa');
    assert.strictEqual(inferCategory('Lata de atún en aceite'), 'despensa');
    assert.strictEqual(inferCategory('Atún fresco'), 'pescaderia');
    assert.strictEqual(inferCategory('Lomos de atún fresco'), 'pescaderia');

    // Tomate procesado a despensa vs fresco a frutería
    assert.strictEqual(inferCategory('Tomate frito'), 'despensa');
    assert.strictEqual(inferCategory('Tomate triturado'), 'despensa');
    assert.strictEqual(inferCategory('Tomates para ensalada'), 'fruteria');
    assert.strictEqual(inferCategory('Tomate rama'), 'fruteria');

    // Pizzas: congelada a congelados vs masa a panadería
    assert.strictEqual(inferCategory('Pizza congelada'), 'congelados');
    assert.strictEqual(inferCategory('Masa de pizza'), 'panaderia');

    // Hamburguesas de carne vs pan de hamburguesa
    assert.strictEqual(inferCategory('Hamburguesas de ternera'), 'carniceria');
    assert.strictEqual(inferCategory('Pan de hamburguesa'), 'panaderia');

    // Conservas vegetales a despensa vs frescas a frutería
    assert.strictEqual(inferCategory('Espárragos en bote'), 'despensa');
    assert.strictEqual(inferCategory('Espárragos trigueros'), 'fruteria');
    assert.strictEqual(inferCategory('Champiñones en lata'), 'despensa');
    assert.strictEqual(inferCategory('Champiñones frescos'), 'fruteria');
  });

  it('parseSingleReminderText procesa cantidades numéricas, formatos y notas', () => {
    // 2 kg de patatas
    const p1 = parseSingleReminderText('2 kg de patatas');
    assert.strictEqual(p1.name, 'Patatas');
    assert.strictEqual(p1.quantity, 2);
    assert.strictEqual(p1.unit, 'kg');
    assert.strictEqual(p1.category, 'fruteria');
    assert.strictEqual(p1.packageFormat, 'granel');

    // 1 docena de huevos
    const p2 = parseSingleReminderText('1 docena de huevos camperos');
    assert.strictEqual(p2.name, 'Huevos camperos');
    assert.strictEqual(p2.quantity, 1);
    assert.strictEqual(p2.unit, 'docena');
    assert.strictEqual(p2.packageFormat, 'docena');
    assert.strictEqual(p2.category, 'lacteos');

    // 2 botes de garbanzos con notas
    const p3 = parseSingleReminderText('2 botes de garbanzos cocidos — Pasillo 3');
    assert.strictEqual(p3.name, 'Garbanzos cocidos');
    assert.strictEqual(p3.quantity, 2);
    assert.strictEqual(p3.unit, 'bote');
    assert.strictEqual(p3.packageFormat, 'bote');
    assert.strictEqual(p3.notes, 'Pasillo 3');
    assert.strictEqual(p3.category, 'despensa');

    // Viñeta y formato entre paréntesis
    const p4 = parseSingleReminderText('• Leche entera (Pack 6 briks)');
    assert.strictEqual(p4.name, 'Leche entera');
    assert.strictEqual(p4.commercialFormat, 'Pack 6 briks');
    assert.strictEqual(p4.category, 'lacteos');
  });

  it('parseSingleReminderText interpreta cantidades en lenguaje natural en español (números escritos y fracciones)', () => {
    // un kilo y medio
    const p1 = parseSingleReminderText('un kilo y medio de tomates');
    assert.strictEqual(p1.name, 'Tomates');
    assert.strictEqual(p1.quantity, 1.5);
    assert.strictEqual(p1.unit, 'kg');
    assert.strictEqual(p1.category, 'fruteria');

    // medio kilo
    const p2 = parseSingleReminderText('medio kilo de carne picada');
    assert.strictEqual(p2.name, 'Carne picada');
    assert.strictEqual(p2.quantity, 0.5);
    assert.strictEqual(p2.unit, 'kg');
    assert.strictEqual(p2.category, 'carniceria');

    // media docena
    const p3 = parseSingleReminderText('media docena de huevos');
    assert.strictEqual(p3.name, 'Huevos');
    assert.strictEqual(p3.quantity, 0.5);
    assert.strictEqual(p3.unit, 'docena');
    assert.strictEqual(p3.category, 'lacteos');

    // tres paquetes
    const p4 = parseSingleReminderText('tres paquetes de macarrones');
    assert.strictEqual(p4.name, 'Macarrones');
    assert.strictEqual(p4.quantity, 3);
    assert.strictEqual(p4.unit, 'pack');
    assert.strictEqual(p4.category, 'despensa');

    // dos botes
    const p5 = parseSingleReminderText('dos botes de lentejas');
    assert.strictEqual(p5.name, 'Lentejas');
    assert.strictEqual(p5.quantity, 2);
    assert.strictEqual(p5.unit, 'bote');
    assert.strictEqual(p5.packageFormat, 'bote');
    assert.strictEqual(p5.category, 'despensa');

    // fracción 1/2
    const p6 = parseSingleReminderText('1/2 kg de fresas');
    assert.strictEqual(p6.name, 'Fresas');
    assert.strictEqual(p6.quantity, 0.5);
    assert.strictEqual(p6.unit, 'kg');
    assert.strictEqual(p6.category, 'fruteria');
  });

  it('parseSingleReminderText limpia prefijos habituales de dictado de Siri y Atajos', () => {
    const siri1 = parseSingleReminderText('Comprar en el super 2 kg de patatas');
    assert.strictEqual(siri1.name, 'Patatas');
    assert.strictEqual(siri1.quantity, 2);
    assert.strictEqual(siri1.unit, 'kg');
    assert.strictEqual(siri1.category, 'fruteria');

    const siri2 = parseSingleReminderText('Apuntar un paquete de café');
    assert.strictEqual(siri2.name, 'Café');
    assert.strictEqual(siri2.quantity, 1);
    assert.strictEqual(siri2.category, 'despensa');

    const siri3 = parseSingleReminderText('Hay que comprar leche desnatada (6 briks)');
    assert.strictEqual(siri3.name, 'Leche desnatada');
    assert.strictEqual(siri3.commercialFormat, '6 briks');
    assert.strictEqual(siri3.category, 'lacteos');

    const siri4 = parseSingleReminderText('Hace falta papel de cocina');
    assert.strictEqual(siri4.name, 'Papel de cocina');
    assert.strictEqual(siri4.category, 'otros');

    const siri5 = parseSingleReminderText('Necesitamos detergente para la lavadora ::: droguería');
    assert.strictEqual(siri5.name, 'Detergente para la lavadora');
    assert.strictEqual(siri5.notes, 'droguería');
    assert.strictEqual(siri5.category, 'otros');
  });

  it('inferDefaultPackageFormat asigna envases comerciales lógicos', () => {
    assert.strictEqual(inferDefaultPackageFormat('Huevos', 'lacteos'), 'docena');
    assert.strictEqual(inferDefaultPackageFormat('Huevos camperos', 'lacteos'), 'docena');
    assert.strictEqual(inferDefaultPackageFormat('Yogures', 'lacteos'), 'pack');
    assert.strictEqual(inferDefaultPackageFormat('Yogur natural', 'lacteos'), 'pack');
    assert.strictEqual(inferDefaultPackageFormat('Pan de hamburguesa', 'panaderia'), 'pack');
    assert.strictEqual(inferDefaultPackageFormat('Bocadillo', 'panaderia'), 'pieza');
    assert.strictEqual(inferDefaultPackageFormat('Bocata de jamón', 'panaderia'), 'pieza');
    assert.strictEqual(inferDefaultPackageFormat('Sandwich mixto', 'panaderia'), 'pieza');
    assert.strictEqual(inferDefaultPackageFormat('Pasta de dientes', 'otros'), 'pieza');
    assert.strictEqual(inferDefaultPackageFormat('Patatas', 'fruteria'), 'malla');
    assert.strictEqual(inferDefaultPackageFormat('Cebollas dulces', 'fruteria'), 'malla');
    assert.strictEqual(inferDefaultPackageFormat('Pechuga de pollo', 'carniceria'), 'bandeja');
    assert.strictEqual(inferDefaultPackageFormat('Salmón fresco', 'pescaderia'), 'bandeja');
    assert.strictEqual(inferDefaultPackageFormat('Garbanzos cocidos', 'despensa'), 'bote');
    assert.strictEqual(inferDefaultPackageFormat('Leche entera', 'lacteos'), 'brik');
    assert.strictEqual(inferDefaultPackageFormat('Espinacas tiernas baby', 'fruteria'), 'bolsa');
    assert.strictEqual(inferDefaultPackageFormat('Espárragos trigueros', 'fruteria'), 'manojo');
    assert.strictEqual(inferDefaultPackageFormat('Galletas Digestive', 'panaderia'), 'pack');
  });

  it('parseRemindersPayload procesa objetos nativos de Apple Shortcuts (Title, Notes, etc.)', () => {
    const appleShortcutsPayload = [
      { Title: 'Comprar 2 kg de tomates', Notes: 'Frutería' },
      { Title: 'Leche entera', Notes: 'Lácteos' },
      { Name: 'Pechuga de pollo' },
    ];
    const items = parseRemindersPayload(appleShortcutsPayload);
    assert.strictEqual(items.length, 3);
    assert.strictEqual(items[0].name, 'Tomates');
    assert.strictEqual(items[0].quantity, 2);
    assert.strictEqual(items[0].unit, 'kg');
    assert.strictEqual(items[0].category, 'fruteria');
    assert.strictEqual(items[0].storeTip, 'Frutería');

    assert.strictEqual(items[1].name, 'Leche entera');
    assert.strictEqual(items[1].category, 'lacteos');

    assert.strictEqual(items[2].name, 'Pechuga de pollo');
    assert.strictEqual(items[2].category, 'carniceria');

    // Diccionario con clave "Reminders" o "Items"
    const wrappedPayload = {
      Reminders: [
        { Title: 'Papel higiénico' },
        { Title: 'Arroz' },
      ],
    };
    const items2 = parseRemindersPayload(wrappedPayload);
    assert.strictEqual(items2.length, 2);
    assert.strictEqual(items2[0].name, 'Papel higiénico');
    assert.strictEqual(items2[0].category, 'otros');
    assert.strictEqual(items2[1].name, 'Arroz');
    assert.strictEqual(items2[1].category, 'despensa');

    // String JSON serializado
    const jsonStringPayload = JSON.stringify([{ Title: 'Manzanas' }]);
    const items3 = parseRemindersPayload(jsonStringPayload);
    assert.strictEqual(items3.length, 1);
    assert.strictEqual(items3[0].name, 'Manzanas');
    assert.strictEqual(items3[0].category, 'fruteria');
  });

  it('mergeImportedItemsIntoShoppingList combina y reactiva productos', () => {
    const currentList: ShoppingItem[] = [
      {
        id: 'item-1',
        name: 'Leche semidesnatada',
        quantity: 1,
        unit: 'l',
        category: 'lacteos',
        checked: true,
        period: 'weekday',
      },
      {
        id: 'item-2',
        name: 'Arroz',
        quantity: 500,
        unit: 'g',
        category: 'despensa',
        checked: false,
        period: 'weekday',
      },
    ];

    const incoming: ShoppingItem[] = [
      {
        id: 'item-new-1',
        name: 'Leche semidesnatada',
        quantity: 2,
        unit: 'l',
        category: 'lacteos',
        checked: false,
        period: 'weekday',
      },
      {
        id: 'item-new-2',
        name: 'Plátanos',
        quantity: 1,
        unit: 'kg',
        category: 'fruteria',
        checked: false,
        period: 'weekday',
      },
    ];

    const { updatedList, addedCount } = mergeImportedItemsIntoShoppingList(currentList, incoming);

    assert.strictEqual(addedCount, 2);
    assert.strictEqual(updatedList.length, 3);

    // Leche semidesnatada debe estar ahora unchecked (checked: false) y sumada a 3L
    const leche = updatedList.find((i) => i.name === 'Leche semidesnatada');
    assert.ok(leche);
    assert.strictEqual(leche?.checked, false);
    assert.strictEqual(leche?.quantity, 3);

    // Plátanos añadido
    const platanos = updatedList.find((i) => i.name === 'Plátanos');
    assert.ok(platanos);
    assert.strictEqual(platanos?.quantity, 1);
    assert.strictEqual(platanos?.category, 'fruteria');
  });
});

