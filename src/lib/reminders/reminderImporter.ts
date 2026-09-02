import type { ShoppingItem, IngredientCategory, PackageFormat } from '@/types';
import { normalizeText } from '@/lib/shoppingListGenerator';

interface ParsedReminderResult {
  name: string;
  quantity?: number;
  unit?: string;
  category: IngredientCategory;
  commercialFormat?: string;
  packageFormat?: PackageFormat;
  notes?: string;
}

/**
 * Infiere la categoría del supermercado / pasillo a partir del nombre del producto.
 * Utiliza reglas contextuales prioritarias (ej. 'caldo de pollo' -> despensa, 'atún en lata' -> despensa)
 * y una taxonomía exhaustiva en español para los 8 pasillos habituales.
 */
export function inferCategory(rawName: string): IngredientCategory {
  const norm = normalizeText(rawName);

  // ─────────────────────────────────────────────────────────────
  // 1. REGLAS CONTEXTUALES DE ALTA PRIORIDAD (Desambiguación)
  // ─────────────────────────────────────────────────────────────

  // Droguería, higiene y papel (desambiguación de 'pasta de dientes', 'papel de cocina', etc.) -> OTROS
  if (
    matchesAny(norm, [
      'pasta de dientes', 'pasta dental', 'cepillo de dientes', 'hilo dental', 'enjuague bucal',
      'papel higienico', 'papel higiénico', 'papel de cocina', 'papel aluminio', 'papel albal',
      'papel de horno', 'papel vegetal', 'bolsas de basura', 'bolsa de basura', 'bolsas basura',
      'pastillas lavavajillas', 'sal lavavajillas', 'friegasuelos'
    ])
  ) {
    return 'otros';
  }

  // Caldos, sopas y concentrados -> DESPENSA (aunque lleven pollo, pescado, verduras)
  if (
    matchesAny(norm, [
      'caldo de pollo', 'caldo de verduras', 'caldo de pescado', 'caldo de carne',
      'caldo de cocido', 'caldo suave', 'caldo casero', 'pastillas de caldo', 'avecrem',
      'fumet', 'sopa de sobre', 'consome', 'consomé', 'caldo'
    ])
  ) {
    return 'despensa';
  }

  // Conservas, latas, botes y salsas procesadas -> DESPENSA
  if (
    matchesAny(norm, [
      'atun en lata', 'atun en aceite', 'atun claro en lata', 'lata de atun', 'latas de atun',
      'bonito en lata', 'bonito del norte en lata', 'sardinas en lata', 'sardinillas en lata',
      'caballa en lata', 'mejillones en escabeche', 'berberechos en lata', 'anchoas en lata',
      'anchoas en aceite', 'ventresca de atun', 'ventresca en lata', 'tomate frito',
      'tomate triturado', 'tomate concentrado', 'tomate pelado', 'salsa de tomate',
      'pimientos del piquillo', 'esparragos en bote', 'esparragos en conserva',
      'alcachofas en bote', 'alcachofas en conserva', 'champinones en lata',
      'champinones en bote', 'maiz dulce', 'maiz en lata', 'garbanzos cocidos',
      'lentejas cocidas', 'alubias cocidas', 'pepinillos', 'aceitunas', 'alcaparras',
      'chucrut', 'palmitos'
    ])
  ) {
    return 'despensa';
  }

  // Cafés, tés, cacao e infusiones -> DESPENSA (aunque lleven menta, hierbabuena, frutos rojos, etc.)
  if (
    matchesAny(norm, [
      'cafe', 'café', 'descafeinado', 'capsulas de cafe', 'cafe molido', 'cafe en grano',
      'te', 'té', 'te verde', 'te negro', 'te rojo', 'te matcha', 'infusion', 'infusiones',
      'poleo', 'poleo menta', 'tila', 'rooibos', 'cacao puro', 'colacao', 'nesquik'
    ])
  ) {
    return 'despensa';
  }

  // Congelados explícitos y precocinados ultracongelados -> CONGELADOS
  if (
    matchesAny(norm, [
      'congelado', 'congelada', 'congelados', 'congeladas',
      'ultracongelado', 'ultracongelada', 'ultracongelados', 'ultracongeladas',
      'helado', 'helados', 'polo', 'polos', 'hielo', 'cubitos de hielo',
      'tarrina de helado', 'bombones helados', 'conos helados', 'sorbete', 'sorbetes',
      'varitas de merluza', 'varitas de pescado', 'nuggets', 'nuggets congelados',
      'croquetas congeladas', 'pizza congelada', 'churros congelados', 'patatas prefritas',
      'verduras congeladas', 'guisantes congelados', 'espinacas congeladas',
      'frutos rojos congelados'
    ])
  ) {
    return 'congelados';
  }

  // Panadería, masas, bocadillos y desayunos compuestos -> PANADERÍA
  if (
    matchesAny(norm, [
      'pan de molde', 'pan de hamburguesa', 'panes de hamburguesa', 'pan para hamburguesa',
      'pan para hamburguesas', 'pan hamburguesa', 'pan burger', 'panes burger', 'bollos de hamburguesa',
      'pan de perrito', 'panes de perrito', 'pan para perritos', 'pan de hot dog', 'panes de hot dog',
      'pan rallado', 'pan integral', 'pan tostado', 'pan de pita', 'pan de cristal',
      'pan bao', 'pan naan', 'masa de pizza', 'masa hojaldre', 'masa quebrada', 'masa filo',
      'obleas de empanadilla', 'base de pizza', 'tortillas de trigo', 'tortillas de maiz',
      'tortillas mexicanas', 'fajitas', 'wraps', 'copos de avena', 'cereales de desayuno',
      'muesli', 'granola', 'corn flakes', 'bocadillo', 'bocadillos', 'bocata', 'bocatas',
      'sandwich', 'sandwiches', 'sandwich mixto', 'montadito', 'montaditos', 'pulga', 'pulguita'
    ])
  ) {
    return 'panaderia';
  }

  // Lácteos especiales y sustitutos vegetales refrigerados -> LÁCTEOS
  if (
    matchesAny(norm, [
      'leche de avena', 'leche de soja', 'leche de almendras', 'bebida de avena',
      'bebida de soja', 'bebida de almendras', 'bebida de arroz', 'leche sin lactosa',
      'claras de huevo', 'clara de huevo', 'queso rallado', 'queso crema', 'queso fresco',
      'queso en lonchas', 'nata para cocinar', 'nata para montar'
    ])
  ) {
    return 'lacteos';
  }

  // ─────────────────────────────────────────────────────────────
  // 2. CATEGORÍAS PRINCIPALES POR TAXONOMÍA
  // ─────────────────────────────────────────────────────────────

  // 1. Panadería, Bollería y Masas (evaluado antes de lácteos para 'croissants de mantequilla', 'galletas de nata', etc.)
  const bakeryKeywords = [
    'pan', 'barra de pan', 'baguette', 'hogaza', 'chapata', 'pan rustico',
    'pan candeal', 'pan de centeno', 'pan de espelta', 'pan sin gluten', 'mollete',
    'molletes', 'picos', 'colines', 'reganas', 'regañás', 'biscote', 'biscotes',
    'tostada', 'tostadas', 'crackers', 'picatostes', 'croutons', 'hojaldre',
    'empanadilla', 'empanadillas', 'galleta', 'galletas', 'cookies', 'magdalena',
    'magdalenas', 'croissant', 'croissants', 'bollo', 'bollos', 'bizcocho',
    'ensaimada', 'sobao', 'sobaos', 'muffin', 'muffins', 'avena', 'bocadillo',
    'bocadillos', 'bocata', 'bocatas', 'sandwich', 'sandwiches', 'montadito',
    'montaditos', 'pulga', 'pulguita'
  ];
  if (matchesAny(norm, bakeryKeywords)) {
    return 'panaderia';
  }

  // 2. Pescadería y Mariscos frescos
  const fishKeywords = [
    'salmon', 'salmón', 'merluza', 'dorada', 'lubina', 'pescado', 'pescadilla',
    'bacalao', 'bonito', 'atun fresco', 'atún fresco', 'emperador', 'pez espada',
    'sardina', 'sardinas', 'boqueron', 'boquerones', 'anchoa', 'anchoas', 'caballa',
    'jurel', 'chicharro', 'trucha', 'corvina', 'lenguado', 'rodaballo', 'gallo',
    'rape', 'mero', 'cabracho', 'congrio', 'panga', 'fletan', 'fletán', 'salmonete',
    'cazon', 'cazón', 'marrajo', 'pez limon', 'calamar', 'calamares', 'chipiron',
    'chipirones', 'sepia', 'sepias', 'choco', 'pulpo', 'pota', 'puntilla', 'rabas',
    'gamba', 'gambas', 'langostino', 'langostinos', 'gambon', 'gambones', 'camaron',
    'camarones', 'cigala', 'cigalas', 'carabinero', 'carabineros', 'bogavante',
    'langosta', 'buey de mar', 'centollo', 'centolla', 'necora', 'nécoras', 'mejillon',
    'mejillones', 'almeja', 'almejas', 'chirla', 'chirlas', 'coquina', 'coquinas',
    'navaja', 'navajas', 'vieira', 'vieiras', 'zamburina', 'zamburiñas', 'percebe',
    'percebes', 'gulas', 'marisco', 'mariscos'
  ];
  if (matchesAny(norm, fishKeywords)) {
    return 'pescaderia';
  }

  // 3. Carnicería, Aves y Embutidos
  const meatKeywords = [
    'pollo', 'pechuga', 'pechugas', 'muslo', 'muslos', 'contramuslo', 'contramuslos',
    'alita', 'alitas', 'jamoncitos', 'carcasa', 'higaditos', 'pavo', 'solomillo de pavo',
    'ternera', 'buey', 'vaca', 'cerdo', 'lomo', 'cinta de lomo', 'solomillo',
    'costilla', 'costillas', 'costillar', 'secreto', 'secreto iberico', 'pluma iberica', 'pluma de cerdo', 'presa', 'entrecot',
    'chuleta', 'chuletas', 'chuleton', 'chuletón', 'carne picada', 'picada', 'carne',
    'conejo', 'cordero', 'cabrito', 'chuletillas', 'paletilla', 'falda', 'morcillo',
    'jarrete', 'redondo', 'babilla', 'tapilla', 'magro', 'hamburguesa', 'hamburguesas',
    'burger', 'albondiga', 'albondigas', 'albóndiga', 'albóndigas', 'san jacobo',
    'milanesa', 'pincho moruno', 'pinchos morunos', 'brocheta', 'brochetas', 'jamon',
    'jamón', 'jamon serrano', 'jamon iberico', 'jamon york', 'jamon cocido', 'lacon',
    'lacón', 'bacon', 'beicon', 'panceta', 'salchicha', 'salchichas', 'frankfurt',
    'bratwurst', 'chorizo', 'morcilla', 'chistorra', 'butifarra', 'fuet', 'salchichon',
    'salchichón', 'longaniza', 'sobrasada', 'lomo embuchado', 'cecina', 'mortadela',
    'chopped', 'salami', 'taquitos de jamon', 'taquitos de pavo', 'compango'
  ];
  if (matchesAny(norm, meatKeywords)) {
    return 'carniceria';
  }

  // 4. Lácteos, Quesos y Huevos
  const dairyKeywords = [
    'leche', 'cuajada', 'batido', 'batidos', 'huevo', 'huevos', 'huevos camperos',
    'huevos de codorniz', 'yogur', 'yogures', 'yogurt', 'kefir', 'kéfir', 'skyr',
    'actimel', 'petit suisse', 'flan', 'flanes', 'natillas', 'arroz con leche', 'mousse',
    'mantequilla', 'margarina', 'nata', 'creme fraiche', 'queso', 'quesos', 'mozzarella',
    'parmesano', 'grana padano', 'cheddar', 'gouda', 'havarti', 'feta', 'burrata',
    'ricotta', 'mascarpone', 'requeson', 'requesón', 'burgos', 'philadelphia',
    'queso de cabra', 'rulo de cabra', 'manchego', 'queso curado', 'queso semicurado',
    'queso tierno', 'tranchetes', 'roquefort', 'cabrales', 'gorgonzola', 'queso azul',
    'brie', 'camembert', 'provolone', 'emmental', 'gruyere', 'quesitos', 'edam'
  ];
  if (matchesAny(norm, dairyKeywords)) {
    return 'lacteos';
  }

  // 5. Frutería, Verduras y Frescos
  const produceKeywords = [
    'manzana', 'manzanas', 'platano', 'plátano', 'platanos', 'plátanos', 'banana',
    'bananas', 'pera', 'peras', 'naranja', 'naranjas', 'mandarina', 'mandarinas',
    'clementina', 'clementinas', 'limon', 'limón', 'limones', 'lima', 'limas',
    'fresa', 'fresas', 'freson', 'fresón', 'arandano', 'arandanos', 'arándano',
    'arándanos', 'frambuesa', 'frambuesas', 'mora', 'moras', 'frutos rojos',
    'uva', 'uvas', 'melon', 'melón', 'sandia', 'sandía', 'pina', 'piña', 'kiwi',
    'kiwis', 'melocoton', 'melocotón', 'nectarina', 'nectarinas', 'paraguayo',
    'paraguayos', 'albaricoque', 'albaricoques', 'ciruela', 'ciruelas', 'cereza',
    'cerezas', 'picota', 'picotas', 'mango', 'mangos', 'papaya', 'aguacate',
    'aguacates', 'granada', 'granadas', 'pomelo', 'pomelos', 'higo', 'higos',
    'caqui', 'caquis', 'persimon', 'tomate', 'tomates', 'lechuga', 'lechugas',
    'cogollo', 'cogollos', 'espinaca', 'espinacas', 'acelga', 'acelgas', 'calabacin',
    'calabacín', 'calabacines', 'berenjena', 'berenjenas', 'pepino', 'pepinos',
    'pimiento', 'pimientos', 'cebolla', 'cebollas', 'cebolleta', 'cebolletas',
    'chalota', 'chalotas', 'puerro', 'puerros', 'patata', 'patatas', 'boniato',
    'boniatos', 'batata', 'batatas', 'zanahoria', 'zanahorias', 'ajo', 'ajos',
    'brocoli', 'brócoli', 'brecol', 'brécol', 'coliflor', 'bimi', 'romanesco',
    'repollo', 'col', 'lombarda', 'calabaza', 'apio', 'remolacha', 'rabano',
    'rábano', 'nabo', 'chirivia', 'chirivía', 'judia verde', 'judias verdes',
    'judía verde', 'judías verdes', 'alcachofa', 'alcachofas', 'esparrago',
    'esparragos', 'espárrago', 'espárragos', 'triguero', 'trigueros', 'champinon',
    'champiñon', 'champiñón', 'champinones', 'champiñones', 'seta', 'setas',
    'boletus', 'portobello', 'shiitake', 'rucula', 'rúcula', 'canonigos',
    'canónigos', 'berros', 'endivia', 'endivias', 'escarola', 'guisante fresco',
    'guisantes frescos', 'haba', 'habas', 'verdura', 'verduras', 'fruta', 'frutas',
    'perejil', 'cilantro', 'albahaca', 'menta', 'hierbabuena', 'cebollino',
    'eneldo', 'romero fresco', 'tomillo fresco'
  ];
  if (matchesAny(norm, produceKeywords)) {
    return 'fruteria';
  }

  // 6. Congelados
  const frozenGeneralKeywords = [
    'congelad', 'ultracongelad', 'helado', 'helados', 'polo', 'polos', 'hielo',
    'croquetas', 'nuggets', 'churros'
  ];
  if (matchesAny(norm, frozenGeneralKeywords)) {
    return 'congelados';
  }

  // 7. Despensa, Pastas, Legumbres, Salsas, Aceites, Bebidas y Especias
  const pantryKeywords = [
    'arroz', 'pasta', 'espagueti', 'espaguetis', 'macarron', 'macarrones', 'pluma',
    'plumas', 'tallarin', 'tallarines', 'espiral', 'espirales', 'fusilli', 'lazo',
    'lazos', 'farfalle', 'fideo', 'fideos', 'tagliatelle', 'fettuccine', 'gnocchi',
    'canelon', 'canelones', 'lasana', 'lasaña', 'orzo', 'cuscus', 'quinoa', 'polenta',
    'trigo sarraceno', 'chia', 'lino', 'sesamo', 'lenteja', 'lentejas', 'garbanzo',
    'garbanzos', 'alubia', 'alubias', 'fabes', 'soja texturizada', 'altramuz',
    'altramuces', 'legumbre', 'legumbres', 'aceite', 'aove', 'virgen extra',
    'vinagre', 'crema balsamica', 'ketchup', 'mayonesa', 'mostaza', 'soja', 'tamari',
    'salsa brava', 'salsa barbacoa', 'salsa rosa', 'alioli', 'tabasco', 'pesto',
    'curry', 'salsa', 'conserva', 'conservas', 'harina', 'maicena', 'maizena',
    'levadura', 'azucar', 'azúcar', 'sacarina', 'stevia', 'eritritol', 'miel',
    'sirope', 'cacao', 'colacao', 'nesquik', 'chocolate', 'canela', 'vainilla',
    'sal', 'pimienta', 'pimenton', 'pimentón', 'oregano', 'orégano', 'curcuma',
    'cúrcuma', 'comino', 'nuez moscada', 'clavo', 'jengibre', 'azafran', 'azafrán',
    'hierbas provenzales', 'laurel', 'ajo en polvo', 'cebolla en polvo', 'nuez',
    'nueces', 'almendra', 'almendras', 'avellana', 'avellanas', 'cacahuete',
    'cacahuetes', 'anacardo', 'anacardos', 'pistacho', 'pistachos', 'pipas',
    'castana', 'castañas', 'pasa', 'pasas', 'datil', 'dátiles', 'ciruelas pasas',
    'orejon', 'orejones', 'patatas fritas', 'chips', 'palomitas', 'nachos', 'snack',
    'snacks', 'cafe', 'café', 'descafeinado', 'te', 'té', 'infusion', 'infusión',
    'manzanilla', 'poleo', 'tila', 'rooibos', 'agua', 'agua mineral', 'zumo',
    'zumos', 'nectar', 'refresco', 'coca cola', 'coca-cola', 'fanta', 'tonica',
    'gaseosa', 'cerveza', 'cervezas', 'vino', 'cava', 'sidra'
  ];
  if (matchesAny(norm, pantryKeywords)) {
    return 'despensa';
  }

  // 8. Otros, Droguería, Limpieza, Higiene, Bebé y Mascotas
  const otherKeywords = [
    'papel higienico', 'papel higiénico', 'papel de cocina', 'servilleta', 'servilletas',
    'panuelo', 'pañuelos', 'papel aluminio', 'papel albal', 'film transparente',
    'papel de horno', 'papel vegetal', 'bolsa de basura', 'bolsas de basura',
    'bolsas basura', 'detergente', 'suavizante', 'lavavajillas', 'pastillas lavavajillas',
    'fairy', 'mistol', 'abrillantador', 'sal lavavajillas', 'friegasuelos', 'limpiador',
    'multiusos', 'kh7', 'quitagrasas', 'lejia', 'lejía', 'amoniaco', 'limpiacristales',
    'desinfectante', 'antical', 'estropajo', 'estropajos', 'bayeta', 'bayetas',
    'fregona', 'escoba', 'recogedor', 'desatascador', 'ambientador', 'gel', 'gel de ducha',
    'gel de bano', 'champu', 'champú', 'acondicionador', 'mascarilla pelo', 'jabon',
    'jabón', 'pasta de dientes', 'dentifrico', 'dentífrico', 'cepillo de dientes',
    'hilo dental', 'enjuague bucal', 'desodorante', 'cuchilla', 'cuchillas',
    'espuma de afeitar', 'compresa', 'compresas', 'tampon', 'tampones', 'salvaslip',
    'salvaslips', 'crema hidratante', 'protector solar', 'algodon', 'algodón',
    'bastoncillos', 'panal', 'panales', 'pañal', 'pañales', 'toallitas',
    'toallitas bebe', 'leche de formula', 'leche infantil', 'potito', 'potitos',
    'papilla', 'pienso', 'comida de perro', 'comida perro', 'comida de gato',
    'comida gato', 'latas de perro', 'latas de gato', 'arena de gato', 'snacks perro',
    'snacks gato', 'pila', 'pilas', 'bombilla', 'bombillas', 'cerilla', 'cerillas',
    'carbon', 'carbón', 'insecticida'
  ];
  if (matchesAny(norm, otherKeywords)) {
    return 'otros';
  }

  return 'otros';
}

function matchesAny(normalizedText: string, keywords: string[]): boolean {
  return keywords.some((kw) => matchesKeyword(normalizedText, kw));
}

function matchesKeyword(normalizedText: string, keyword: string): boolean {
  const normKw = normalizeText(keyword);
  if (!normKw) return false;
  const escaped = normKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(normalizedText);
}

/**
 * Infiere el formato comercial por defecto si no se especificó unidad explícita.
 */
export function inferDefaultPackageFormat(
  name: string,
  category: IngredientCategory
): PackageFormat {
  const norm = normalizeText(name);

  // 1. Docena (Huevos)
  if (/huevos?|docena/.test(norm)) return 'docena';

  // 2. Droguería, higiene y limpieza (evaluado al inicio para evitar que 'pasta de dientes' colisione con 'pasta')
  if (
    /pasta de dientes|pasta dental|dentifrico|dentífrico|cepillo de dientes|hilo dental|enjuague bucal|colutorio|estropajo|bayeta|fregona|ambientador|jabon|jabón|desodorante|gel de ducha|gel de bano|champu|champú|crema hidratante/.test(
      norm
    )
  ) {
    if (/champu|champú|gel|crema|colutorio|enjuague/.test(norm)) return 'bote';
    return 'pieza';
  }

  if (
    /papel higienico|papel higiénico|papel de cocina|servilletas|panales|pañales|toallitas|bolsas de basura|bolsa de basura|bolsas basura|pastillas lavavajillas|pilas/.test(
      norm
    )
  ) {
    return 'pack';
  }

  // 3. Panadería, desayunos y bocadillos (evaluado antes de carnicería para 'pan de hamburguesa', 'pan de perrito', etc.)
  if (
    /pan de molde|pan de hamburguesa|panes de hamburguesa|pan burger|panes burger|bollos de hamburguesa|pan de perrito|panes de perrito|tortillas|fajitas|wraps|galletas|cookies|magdalenas|croissants?|bollos|muffins|picos|colines|reganas|regañás|tostadas|biscotes|cereales|copos de avena|sobaos|ensaimadas|masas? de pizza|masa hojaldre|masa quebrada|masa filo|obleas/.test(
      norm
    )
  ) {
    return 'pack';
  }

  if (
    /bocadillo|bocadillos|bocata|bocatas|sandwich|sandwiches|barra de pan|baguette|hogaza|chapata|molletes?|pan rustico|pan candeal|pan sin gluten/.test(
      norm
    )
  ) {
    return 'pieza';
  }

  // 4. Malla (Frutas y verduras en red comercial)
  if (/patatas?|papas?|cebollas?|naranjas?|mandarinas?|clementinas?|limones?|aguacates?|ajos?|kiwis?/.test(norm)) {
    return 'malla';
  }

  // 5. Bandeja (Carnes y pescados frescos de lineal o verduras cortadas)
  if (
    /pechugas?|lomos?|filetes?|chuletas?|carne picada|picada|alitas?|muslos?|contramuslos?|solomillo|secreto|presa|costillas?|hamburguesas?|salchichas?|salmon|merluza|dorada|lubina|dados|champiñones laminados|setas/.test(
      norm
    )
  ) {
    return 'bandeja';
  }

  // 6. Bote / Frasco (Conservas, legumbres cocidas, salsas, mermeladas, especias)
  if (
    /garbanzos?|lentejas?|alubias?|conservas?|mermelada|mayonesa|salsa|bote|frasco|tomate frito en tarro|pepinillos|aceitunas|alcaparras/.test(
      norm
    )
  ) {
    return 'bote';
  }

  // 7. Brik (Leches, caldos, zumos, nata, tomate frito)
  if (/leche|caldo|zumo|tomate frito|nata|bebida de|batido|brik/.test(norm)) {
    return 'brik';
  }

  // 8. Bolsa (Verduras de hoja, ensaladas, congelados, pastas, legumbres secas, arroz)
  if (
    /espinacas?|ensalada|rucula|rúcula|canonigos|canónigos|lechuga iceberg|zanahorias?|pasta seca|pasta fresca|pasta integral|macarron|macarrones?|espagueti|espaguetis?|fideos?|tallarines?|fusilli|lazos|plumas|espirales|arroz|legumbres?|guisantes?|judias verdes congeladas|patatas congeladas|bolsa/.test(
      norm
    )
  ) {
    return 'bolsa';
  }

  // 9. Manojo (Frescos de frutería atados)
  if (/esparragos?|espárragos?|puerros?|perejil|cilantro|albahaca|cebollino|manojo/.test(norm)) {
    return 'manojo';
  }

  // 10. Lácteos en pack
  if (/yogur|yogures|actimel|petit|flan|flanes|natillas|cuajada|postre|gelatina|pack|paquete/.test(norm)) {
    return 'pack';
  }

  // 11. Pieza (panes sueltos, productos unitarios)
  if (/pan|pieza|unidad/.test(norm)) {
    return 'pieza';
  }

  if (category === 'panaderia') return 'pack';
  if (category === 'lacteos') return 'pack';

  return 'granel';
}

const SPANISH_NUMBER_WORDS: Record<string, number> = {
  un: 1,
  una: 1,
  uno: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
  once: 11,
  doce: 12,
};

/**
 * Parsea una línea de texto libre de Recordatorios a datos estructurados de ingrediente.
 * Ejemplo: "2 kg de patatas", "un kilo y medio de tomates", "1 docena de huevos", "Leche entera (3 briks)", "Pechuga de pollo"
 */
export function parseSingleReminderText(rawLine: string): ParsedReminderResult {
  let text = rawLine.trim();

  // 1. Eliminar prefijos comunes de viñetas, números de lista o checkboxes
  text = text.replace(/^([•\-\*+]|\d+[\.\)]|\[[ xX]?\]|\([ xX]?\))\s*/, '').trim();

  // 2. Eliminar verbos y fórmulas iniciales de dictado de Siri / Atajos
  text = text
    .replace(
      /^(comprar|traer|anadir|añadir|coger|llevar|pedir|poner|apuntar|pillar|necesitamos|hace\s+falta|hay\s+que\s+comprar|recordar\s+comprar|acordarse\s+de\s+comprar)\s+(?:en\s+el\s+super\s+|del\s+super\s+|de\s+la\s+tienda\s+)?/i,
      ''
    )
    .trim();

  let notes: string | undefined;

  // 3. Extraer notas si están separadas por ::: o — o |
  if (text.includes(':::')) {
    const parts = text.split(':::');
    text = parts[0].trim();
    notes = parts.slice(1).join(' ').trim();
  } else if (text.includes(' — ')) {
    const parts = text.split(' — ');
    text = parts[0].trim();
    notes = parts.slice(1).join(' ').trim();
  } else if (text.includes(' | ')) {
    const parts = text.split(' | ');
    text = parts[0].trim();
    notes = parts.slice(1).join(' ').trim();
  }

  // 4. Detectar formato o nota entre paréntesis al final ej: "Leche entera (2L)" o "Huevos (1 docena)"
  let formatInParentheses: string | undefined;
  const parenMatch = text.match(/\(([^)]+)\)$/);
  if (parenMatch) {
    formatInParentheses = parenMatch[1].trim();
    text = text.replace(/\(([^)]+)\)$/, '').trim();
  }

  let quantity: number | undefined;
  let unit: string | undefined;
  let packageFormat: PackageFormat | undefined;
  let commercialFormat: string | undefined = formatInParentheses;

  // 5. Patrones compuestos de cantidad textual en español (ej. "kilo y medio", "medio kilo", "media docena")
  const compoundTextPatterns: Array<{
    regex: RegExp;
    qty: number;
    unit: string;
    pkgFormat?: PackageFormat;
    formatStr?: string;
  }> = [
    {
      regex: /^(?:(?:1|un|una)\s+)?kilo\s+y\s+medio\s+(?:de\s+)?/i,
      qty: 1.5,
      unit: 'kg',
      pkgFormat: 'granel',
      formatStr: '1.5 kg',
    },
    {
      regex: /^(?:(?:1|un|una)\s+)?litro\s+y\s+medio\s+(?:de\s+)?/i,
      qty: 1.5,
      unit: 'l',
      pkgFormat: 'brik',
      formatStr: '1.5 L',
    },
    {
      regex: /^medio\s+kilo\s+(?:de\s+)?/i,
      qty: 0.5,
      unit: 'kg',
      pkgFormat: 'granel',
      formatStr: '500g (0.5 kg)',
    },
    {
      regex: /^medio\s+litro\s+(?:de\s+)?/i,
      qty: 0.5,
      unit: 'l',
      pkgFormat: 'brik',
      formatStr: '500ml',
    },
    {
      regex: /^media\s+docena\s+(?:de\s+)?/i,
      qty: 0.5,
      unit: 'docena',
      pkgFormat: 'docena',
      formatStr: 'Media docena (6 uds)',
    },
    {
      regex: /^(?:(?:un\s+)?cuarto\s+de\s+kilo|250\s*g(?:ramos)?)\s+(?:de\s+)?/i,
      qty: 0.25,
      unit: 'kg',
      pkgFormat: 'granel',
      formatStr: '250g',
    },
  ];

  for (const cmp of compoundTextPatterns) {
    const m = text.match(cmp.regex);
    if (m) {
      quantity = cmp.qty;
      unit = cmp.unit;
      packageFormat = cmp.pkgFormat;
      commercialFormat = commercialFormat || cmp.formatStr;
      text = text.slice(m[0].length).trim();
      break;
    }
  }

  // 6. Patrones estándar de cantidad (número o palabra) + unidad al principio
  if (quantity === undefined) {
    const qtyWords = Object.keys(SPANISH_NUMBER_WORDS).join('|');
    const unitsPattern =
      'kg|kilos?|g|gr|gramos?|l|litros?|ml|cl|centilitros?|uds?|unidades?|piezas?|docenas?|paquetes?|packs?|cajas?|bandejas?|mallas?|bolsas?|botes?|tarros?|frascos?|briks?|tetrabriks?|latas?|manojos?|barras?|botellas?|garrafas?|tarrinas?|tabletas?|tubos?';
    
    // Regex para: "1/2 kg de...", "2 kg de...", "1.5 l...", "3/4 kg...", "dos paquetes de...", "1 docena..."
    const generalQtyRegex = new RegExp(
      `^((\\d+\\s*[\\/⁄]\\s*\\d+|\\d+\\s+[½¼¾]|[½¼¾]|\\d+(?:[.,]\\d+)?|${qtyWords})\\s*(?:x\\s*)?)(${unitsPattern})?\\s*(?:de\\s+)?`,
      'i'
    );

    const match = text.match(generalQtyRegex);

    if (match) {
      const rawQtyStr = match[2]?.toLowerCase().trim();
      const rawUnit = match[3]?.toLowerCase().trim();

      let parsedQty: number | undefined;

      if (rawQtyStr) {
        if (SPANISH_NUMBER_WORDS[rawQtyStr] !== undefined) {
          parsedQty = SPANISH_NUMBER_WORDS[rawQtyStr];
        } else if (rawQtyStr === '½') {
          parsedQty = 0.5;
        } else if (rawQtyStr === '¼') {
          parsedQty = 0.25;
        } else if (rawQtyStr === '¾') {
          parsedQty = 0.75;
        } else if (rawQtyStr.includes('/')) {
          const [num, den] = rawQtyStr.split('/').map((s) => parseFloat(s.trim()));
          if (!isNaN(num) && !isNaN(den) && den !== 0) {
            parsedQty = num / den;
          }
        } else {
          parsedQty = parseFloat(rawQtyStr.replace(',', '.'));
        }
      }

      if (parsedQty !== undefined && !isNaN(parsedQty) && parsedQty > 0) {
        quantity = parsedQty;
        text = text.slice(match[0].length).trim();

        if (rawUnit) {
          if (/^kg|kilos?$/.test(rawUnit)) {
            unit = 'kg';
            packageFormat = packageFormat || 'granel';
          } else if (/^g|gr|gramos?$/.test(rawUnit)) {
            unit = 'g';
            packageFormat = packageFormat || 'granel';
          } else if (/^l|litros?$/.test(rawUnit)) {
            unit = 'l';
            packageFormat = packageFormat || 'brik';
          } else if (/^ml|cl|centilitros?$/.test(rawUnit)) {
            unit = 'ml';
          } else if (/^uds?|unidades?|piezas?$/.test(rawUnit)) {
            unit = 'uds';
            packageFormat = 'pieza';
          } else if (/^docenas?$/.test(rawUnit)) {
            unit = 'docena';
            packageFormat = 'docena';
            commercialFormat = commercialFormat || `${quantity} ${quantity === 1 ? 'docena' : 'docenas'}`;
          } else if (/^bandejas?$/.test(rawUnit)) {
            unit = 'bandeja';
            packageFormat = 'bandeja';
            commercialFormat = commercialFormat || `${quantity} ${quantity === 1 ? 'Bandeja' : 'Bandejas'}`;
          } else if (/^mallas?$/.test(rawUnit)) {
            unit = 'malla';
            packageFormat = 'malla';
            commercialFormat = commercialFormat || `${quantity} ${quantity === 1 ? 'Malla' : 'Mallas'}`;
          } else if (/^bolsas?$/.test(rawUnit)) {
            unit = 'bolsa';
            packageFormat = 'bolsa';
            commercialFormat = commercialFormat || `${quantity} ${quantity === 1 ? 'Bolsa' : 'Bolsas'}`;
          } else if (/^botes?|tarros?|frascos?$/.test(rawUnit)) {
            unit = 'bote';
            packageFormat = 'bote';
            commercialFormat = commercialFormat || `${quantity} ${quantity === 1 ? 'Bote' : 'Botes'}`;
          } else if (/^briks?|tetrabriks?$/.test(rawUnit)) {
            unit = 'brik';
            packageFormat = 'brik';
            commercialFormat = commercialFormat || `${quantity} ${quantity === 1 ? 'Brik' : 'Briks'}`;
          } else if (/^latas?$/.test(rawUnit)) {
            unit = 'lata';
            packageFormat = 'pack';
            commercialFormat = commercialFormat || `${quantity} ${quantity === 1 ? 'Lata' : 'Latas'}`;
          } else if (/^manojos?$/.test(rawUnit)) {
            unit = 'manojo';
            packageFormat = 'manojo';
            commercialFormat = commercialFormat || `${quantity} ${quantity === 1 ? 'Manojo' : 'Manojos'}`;
          } else if (/^paquetes?|packs?|cajas?$/.test(rawUnit)) {
            unit = 'pack';
            packageFormat = 'pack';
            commercialFormat = commercialFormat || `${quantity} ${quantity === 1 ? 'Pack' : 'Packs'}`;
          } else if (/^botellas?|garrafas?$/.test(rawUnit)) {
            unit = 'botella';
            packageFormat = 'brik';
            commercialFormat = commercialFormat || `${quantity} ${quantity === 1 ? 'Botella' : 'Botellas'}`;
          } else if (/^tarrinas?$/.test(rawUnit)) {
            unit = 'tarrina';
            packageFormat = 'bote';
            commercialFormat = commercialFormat || `${quantity} ${quantity === 1 ? 'Tarrina' : 'Tarrinas'}`;
          } else if (/^tabletas?$/.test(rawUnit)) {
            unit = 'tableta';
            packageFormat = 'pack';
            commercialFormat = commercialFormat || `${quantity} ${quantity === 1 ? 'Tableta' : 'Tabletas'}`;
          } else if (/^tubos?$/.test(rawUnit)) {
            unit = 'tubo';
            packageFormat = 'pieza';
            commercialFormat = commercialFormat || `${quantity} ${quantity === 1 ? 'Tubo' : 'Tubos'}`;
          } else if (/^barras?$/.test(rawUnit)) {
            unit = 'barra';
            packageFormat = 'pieza';
            commercialFormat = commercialFormat || `${quantity} ${quantity === 1 ? 'Barra' : 'Barras'}`;
          }
        }
      }
    }
  }

  // 7. Limpiar conectores iniciales sobrantes ("de la", "del", "un", "unas", etc.)
  text = text.replace(/^(?:de\s+la\s+|de\s+los\s+|de\s+las\s+|del\s+|de\s+|un\s+|una\s+|unos\s+|unas\s+)/i, '').trim();

  // 8. Capitalizar nombre y deducir categoría y envase final
  const cleanedName = text ? text.charAt(0).toUpperCase() + text.slice(1) : rawLine.trim();
  const category = inferCategory(cleanedName);
  const finalPackageFormat = packageFormat || inferDefaultPackageFormat(cleanedName, category);

  return {
    name: cleanedName || rawLine.trim(),
    quantity,
    unit: unit || (quantity ? 'uds' : undefined),
    category,
    commercialFormat,
    packageFormat: finalPackageFormat,
    notes,
  };
}

function extractTitleAndNotesFromObject(obj: Record<string, unknown>): { title: string; notes?: string } {
  const titleKeys = ['title', 'name', 'text', 'summary', 'value', 'item', 'content', 'label'];
  const noteKeys = ['notes', 'note', 'description', 'body', 'details'];

  let title = '';
  let notes: string | undefined;

  for (const [key, val] of Object.entries(obj)) {
    const k = key.toLowerCase().trim();
    if (!title && titleKeys.includes(k) && typeof val === 'string' && val.trim()) {
      title = val.trim();
    }
    if (!notes && noteKeys.includes(k) && typeof val === 'string' && val.trim()) {
      notes = val.trim();
    }
  }

  if (!title) {
    for (const val of Object.values(obj)) {
      if (typeof val === 'string' && val.trim()) {
        title = val.trim();
        break;
      }
    }
  }

  return { title, notes };
}

/**
 * Parsea un payload flexible recibido de Atajos de Apple / Siri / Webhook.
 */
export function parseRemindersPayload(payload: unknown): ShoppingItem[] {
  if (!payload) return [];

  // Si llega como string pero contiene JSON (ej. array o diccionario serializado)
  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        const parsedJson = JSON.parse(trimmed);
        return parseRemindersPayload(parsedJson);
      } catch {
        // Continuar como texto plano si falla JSON.parse
      }
    }
    const rawLines = trimmed.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    return buildShoppingItemsFromLines(rawLines);
  }

  const rawLines: string[] = [];

  if (Array.isArray(payload)) {
    for (const item of payload) {
      if (typeof item === 'string') {
        rawLines.push(...item.split(/\r?\n/).map((s) => s.trim()).filter(Boolean));
      } else if (item && typeof item === 'object') {
        const { title, notes } = extractTitleAndNotesFromObject(item as Record<string, unknown>);
        if (title) {
          rawLines.push(notes ? `${title} — ${notes}` : title);
        }
      }
    }
    return buildShoppingItemsFromLines(rawLines);
  }

  if (typeof payload === 'object' && payload !== null) {
    const obj = payload as Record<string, unknown>;

    // Buscar campos contenedores independientemente de mayúsculas/minúsculas
    for (const [key, val] of Object.entries(obj)) {
      const k = key.toLowerCase().trim();
      if (
        ['items', 'reminders', 'recordatorios', 'list', 'lista', 'data', 'productos', 'ingredients'].includes(k)
      ) {
        return parseRemindersPayload(val);
      }
      if (['text', 'texto', 'input', 'body'].includes(k) && typeof val === 'string') {
        return parseRemindersPayload(val);
      }
    }

    // Si es un único objeto de recordatorio { Title: "..." }
    const { title, notes } = extractTitleAndNotesFromObject(obj);
    if (title) {
      return buildShoppingItemsFromLines([notes ? `${title} — ${notes}` : title]);
    }
  }

  return [];
}

function buildShoppingItemsFromLines(rawLines: string[]): ShoppingItem[] {
  const items: ShoppingItem[] = [];
  const now = Date.now();

  rawLines.forEach((line, idx) => {
    if (!line) return;
    const parsed = parseSingleReminderText(line);
    if (!parsed.name) return;

    items.push({
      id: `custom-reminders-${now}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      name: parsed.name,
      quantity: parsed.quantity,
      unit: parsed.unit,
      commercialFormat: parsed.commercialFormat,
      packageFormat: parsed.packageFormat,
      storeTip: parsed.notes,
      category: parsed.category,
      checked: false,
      isCustom: true,
      period: 'weekday',
    });
  });

  return items;
}

/**
 * Fusiona los nuevos elementos importados con la lista de la compra existente.
 * Si un producto con el mismo nombre ya existe, lo actualiza a pendiente si estaba marcado.
 */
export function mergeImportedItemsIntoShoppingList(
  currentList: ShoppingItem[] = [],
  newItems: ShoppingItem[] = []
): { updatedList: ShoppingItem[]; addedCount: number } {
  const list = [...currentList];
  let addedCount = 0;

  for (const newItem of newItems) {
    const normNewName = normalizeText(newItem.name);
    const existingIndex = list.findIndex((item) => normalizeText(item.name) === normNewName);

    if (existingIndex >= 0) {
      const existing = list[existingIndex];
      // Si ya existía pero estaba comprado, desmarcarlo
      const updatedItem: ShoppingItem = {
        ...existing,
        checked: false,
        category: newItem.category || existing.category,
        packageFormat: newItem.packageFormat || existing.packageFormat,
        quantity: newItem.quantity && existing.quantity && existing.unit === newItem.unit
          ? existing.quantity + newItem.quantity
          : existing.quantity || newItem.quantity,
        commercialFormat: newItem.commercialFormat || existing.commercialFormat,
        storeTip: newItem.storeTip || existing.storeTip,
      };
      list[existingIndex] = updatedItem;
      addedCount++;
    } else {
      list.push(newItem);
      addedCount++;
    }
  }

  return { updatedList: list, addedCount };
}
