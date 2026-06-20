const fs = require('fs');

// Load environment variables manually
const env = {};
try {
  const envContent = fs.readFileSync('.env', 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      env[key] = value;
    }
  });
} catch (e) {
  console.error("Error reading .env file:", e.message);
  process.exit(1);
}

const SUPABASE_URL = (env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const ANON_KEY    = env.VITE_SUPABASE_ANON_KEY;
const ADMIN_EMAIL = env.VITE_ADMIN_EMAIL;

if (!SUPABASE_URL || !ANON_KEY || !ADMIN_EMAIL) {
  console.error("Missing required env vars. Check .env file.");
  process.exit(1);
}

// We'll try the first argument as password
const ADMIN_PASS = process.argv[2];
if (!ADMIN_PASS) {
  console.error("Usage: node seed_products.cjs <ADMIN_PASSWORD>");
  process.exit(1);
}

const newProducts = [
  // Cárnicos y Embutidos
  { name: 'Lomo de cerdo (lb)', price: 1620, description: 'Lomo de cerdo fresco y de excelente calidad.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1602489114757-540d54a20b08?w=600', badge: 'MÁS VENDIDO', stock: 99, active: true },
  { name: 'Picadillo de pollo a granel (lb)', price: 450, description: 'Picadillo de pollo fresco listo para cocinar.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600', badge: null, stock: 99, active: true },
  { name: 'Picadillo de pollo de tubo 400g', price: 680, description: 'Tubo de picadillo de pollo para preparar tus recetas.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=600', badge: null, stock: 99, active: true },
  { name: 'Hamburguesas (5 unidades)', price: 560, description: 'Hamburguesas listas para freír u hornear.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600', badge: 'OFERTA', stock: 99, active: true },
  { name: 'Mollejas (kg)', price: 1500, description: 'Mollejas de pollo limpias y frescas.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1606728035253-49e190477c84?w=600', badge: null, stock: 99, active: true },
  { name: 'Mortadella 500g', price: 690, description: 'Mortadella fresca ideal para meriendas.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1541048611158-2eb14df7783d?w=600', badge: null, stock: 99, active: true },
  { name: 'Mortadella 1kg', price: 1350, description: 'Mortadella fresca en formato familiar.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1541048611158-2eb14df7783d?w=600', badge: null, stock: 99, active: true },
  { name: 'Cartón de Huevos (30 unidades)', price: 2800, description: 'Cartón de huevos frescos de granja.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1516448424440-9dbca97779c1?w=600', badge: 'MÁS VENDIDO', stock: 99, active: true },
  // A Granel
  { name: 'Arroz Guyanés (lb)', price: 330, description: 'Arroz Guyanés de grano largo a granel.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600', badge: null, stock: 99, active: true },
  { name: 'Azúcar blanca (lb)', price: 450, description: 'Azúcar blanca refinada a granel.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1581781881951-e73796d1947b?w=600', badge: null, stock: 99, active: true },
  { name: 'Sal gruesa (lb)', price: 180, description: 'Sal gruesa para sazonar tus comidas.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=600', badge: null, stock: 99, active: true },
  { name: 'Frijoles negros (lb)', price: 370, description: 'Frijoles negros de grano seleccionado.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=600', badge: null, stock: 99, active: true },
  // Bebidas
  { name: 'Malta Guajira 1.5L', price: 1430, description: 'Bebida de malta Guajira tamaño familiar.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600', badge: null, stock: 99, active: true },
  { name: 'Malta Guajira 330ml', price: 415, description: 'Bebida de malta Guajira lata individual.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600', badge: null, stock: 99, active: true },
  { name: 'Malta Burger Meester', price: 400, description: 'Refrescante malta Burger Meester importada.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1527960656366-ee2a999e3286?w=600', badge: null, stock: 99, active: true },
  { name: 'Cerveza 3 Horses', price: 410, description: 'Cerveza 3 Horses importada de gran sabor.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1600788886242-5c96aabe3757?w=600', badge: null, stock: 99, active: true },
  { name: 'Cerveza Cristal', price: 400, description: 'La cerveza preferida de Cuba.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600', badge: 'POPULAR', stock: 99, active: true },
  { name: 'Refresco de Cola 1.5L', price: 850, description: 'Refresco gaseado sabor Cola familiar.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600', badge: null, stock: 99, active: true },
  { name: 'Refresco de Limón 1.5L', price: 850, description: 'Refresco gaseado sabor Limón familiar.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600', badge: null, stock: 99, active: true },
  { name: 'Refresco de Naranja 1.5L', price: 850, description: 'Refresco gaseado sabor Naranja familiar.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600', badge: null, stock: 99, active: true },
  { name: 'Agua 1.5L', price: 340, description: 'Agua mineral natural embotellada.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1560012206-8d197cca814c?w=600', badge: null, stock: 99, active: true },
  // Abarrotes
  { name: 'Paquete de Arroz 1kg', price: 660, description: 'Paquete de arroz de grano entero 1kg.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600', badge: null, stock: 99, active: true },
  { name: 'Paquete de Frijoles 1kg', price: 830, description: 'Paquete de frijoles negros seleccionados 1kg.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=600', badge: null, stock: 99, active: true },
  { name: 'Paquete de Azúcar 1kg', price: 980, description: 'Paquete de azúcar blanca refinada 1kg.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1581781881951-e73796d1947b?w=600', badge: null, stock: 99, active: true },
  { name: 'Paquete de Avena 1lb', price: 830, description: 'Avena en hojuelas paquete de 1lb.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=600', badge: null, stock: 99, active: true },
  { name: 'Paquete de Chícharos verdes 1lb', price: 800, description: 'Chícharos verdes secos seleccionados 1lb.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=600', badge: null, stock: 99, active: true },
  { name: 'Paquete de Garbanzos 1lb', price: 850, description: 'Garbanzos seleccionados ideales para guisados.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1547058881-aa0edd92aab3?w=600', badge: null, stock: 99, active: true },
  { name: 'Paquete de Café Roche', price: 1000, description: 'Café Roche aromático y fuerte.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600', badge: 'POPULAR', stock: 99, active: true },
  { name: 'Paquete de Galletas de soda', price: 215, description: 'Galletas de soda crujientes ideales para merendar.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=600', badge: null, stock: 99, active: true },
  { name: 'Paquete de Gelatina', price: 350, description: 'Gelatina de sabores variados.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600', badge: null, stock: 99, active: true },
  { name: 'Paquete de Espaguetis', price: 260, description: 'Pasta de espaguetis de sémola de trigo.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=600', badge: null, stock: 99, active: true },
  { name: 'Pomo de Pasta de tomate', price: 580, description: 'Pasta de tomate concentrada para salsas.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600', badge: null, stock: 99, active: true },
  { name: 'Pomo de Mayonesa Celorrio', price: 1840, description: 'Mayonesa Celorrio cremosa y de gran sabor.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1570145820259-b5b80c5c8bd6?w=600', badge: null, stock: 99, active: true },
  { name: 'Pomo de Vinagre 1L', price: 300, description: 'Vinagre blanco ideal para ensaladas y sazonar.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=600', badge: null, stock: 99, active: true },
  { name: 'Pomo de Vino seco 1L', price: 300, description: 'Vino seco de cocina 1L para tus mejores guisados.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600', badge: null, stock: 99, active: true },
  { name: 'Lata de Leche evaporada', price: 690, description: 'Leche evaporada cremosa para postres y café.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600', badge: null, stock: 99, active: true },
  { name: 'Lata de Fanguito', price: 600, description: 'Dulce de leche condensada cocinada (fanguito).', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1600431521340-491eca880813?w=600', badge: null, stock: 99, active: true },
  { name: 'Barra de Queso Crema', price: 1530, description: 'Queso crema suave y untable.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=600', badge: null, stock: 99, active: true },
  { name: 'Lata de Atún', price: 550, description: 'Atún desmenuzado en aceite vegetal.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600', badge: null, stock: 99, active: true },
  { name: 'Lata de Sardinas', price: 820, description: 'Sardinas en salsa de tomate.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600', badge: null, stock: 99, active: true }
];

async function main() {
  try {
    console.log("1. Authenticating as admin...");
    const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS })
    });

    if (!loginRes.ok) {
      const txt = await loginRes.text();
      throw new Error(`Auth failed: ${txt}`);
    }

    const { access_token } = await loginRes.json();
    console.log("   ✓ Authenticated successfully");

    const headers = {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    };

    // 2. Delete combo_items
    console.log("2. Deleting combo_items...");
    const delComboItems = await fetch(`${SUPABASE_URL}/rest/v1/combo_items?id=not.is.null`, {
      method: 'DELETE',
      headers
    });
    if (!delComboItems.ok) {
      const txt = await delComboItems.text();
      console.warn("   Warning deleting combo_items:", txt);
    } else {
      console.log("   ✓ Combo items deleted");
    }

    // 3. Delete products
    console.log("3. Deleting existing products...");
    const delRes = await fetch(`${SUPABASE_URL}/rest/v1/products?id=not.is.null`, {
      method: 'DELETE',
      headers
    });
    if (!delRes.ok) {
      const txt = await delRes.text();
      throw new Error(`Failed to delete products: ${txt}`);
    }
    console.log("   ✓ Products deleted successfully");

    // 4. Insert new products in batches of 10
    console.log(`4. Inserting ${newProducts.length} new products...`);
    const batchSize = 10;
    let insertedCount = 0;
    for (let i = 0; i < newProducts.length; i += batchSize) {
      const batch = newProducts.slice(i, i + batchSize);
      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify(batch)
      });
      if (!insertRes.ok) {
        const txt = await insertRes.text();
        throw new Error(`Failed to insert batch starting at ${i}: ${txt}`);
      }
      const data = await insertRes.json();
      insertedCount += data.length;
      console.log(`   ✓ Batch ${Math.floor(i/batchSize)+1}: inserted ${data.length} products`);
    }

    console.log(`\n✅ SUCCESS! Added ${insertedCount} products to database.`);
  } catch (error) {
    console.error("\n❌ Migration failed:", error.message);
    process.exit(1);
  }
}

main();
