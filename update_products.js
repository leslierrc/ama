const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not found in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const newProducts = [
  // Cárnicos y Embutidos
  { name: 'Lomo de cerdo (lb)', price: 1620, description: 'Lomo de cerdo fresco y de excelente calidad.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1602489114757-540d54a20b08?w=600', badge: 'MÁS VENDIDO' },
  { name: 'Picadillo de pollo a granel (lb)', price: 450, description: 'Picadillo de pollo fresco listo para cocinar.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600' },
  { name: 'Picadillo de pollo de tubo 400g', price: 680, description: 'Tubo de picadillo de pollo para preparar tus recetas.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1560684352-8497838a2229?w=600' },
  { name: 'Hamburguesas (5 unidades)', price: 560, description: 'Hamburguesas listas para freír u hornear.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600', badge: 'OFERTA' },
  { name: 'Mollejas (kg)', price: 1500, description: 'Mollejas de pollo limpias y frescas.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1606728035253-49e190477c84?w=600' },
  { name: 'Mortadella 500g', price: 690, description: 'Mortadella fresca ideal para meriendas.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1541048611158-2eb14df7783d?w=600' },
  { name: 'Mortadella 1kg', price: 1350, description: 'Mortadella fresca en formato familiar.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1541048611158-2eb14df7783d?w=600' },
  { name: 'Cartón de Huevos (30 unidades)', price: 2800, description: 'Cartón de huevos frescos de granja.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1516448424440-9dbca97779c1?w=600', badge: 'MÁS VENDIDO' },

  // A Granel
  { name: 'Arroz Guyanés (lb)', price: 330, description: 'Arroz Guyanés de grano largo a granel.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600' },
  { name: 'Azúcar blanca (lb)', price: 450, description: 'Azúcar blanca refinada a granel.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1581781881951-e73796d1947b?w=600' },
  { name: 'Sal gruesa (lb)', price: 180, description: 'Sal gruesa para sazonar tus comidas.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=600' },
  { name: 'Frijoles negros (lb)', price: 370, description: 'Frijoles negros de grano seleccionado.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=600' },

  // Bebidas
  { name: 'Malta Guajira 1.5L', price: 1430, description: 'Bebida de malta Guajira tamaño familiar.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600' },
  { name: 'Malta Guajira 330ml', price: 415, description: 'Bebida de malta Guajira lata individual.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600' },
  { name: 'Malta Burger Meester', price: 400, description: 'Refrescante malta Burger Meester importada.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1527960656366-ee2a999e3286?w=600' },
  { name: 'Cerveza 3 Horses', price: 410, description: 'Cerveza 3 Horses importada de gran sabor.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1600788886242-5c96aabe3757?w=600' },
  { name: 'Cerveza Cristal', price: 400, description: 'La cerveza preferida de Cuba.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600', badge: 'POPULAR' },
  { name: 'Refresco de Cola 1.5L', price: 850, description: 'Refresco gaseado sabor Cola familiar.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600' },
  { name: 'Refresco de Limón 1.5L', price: 850, description: 'Refresco gaseado sabor Limón familiar.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600' },
  { name: 'Refresco de Naranja 1.5L', price: 850, description: 'Refresco gaseado sabor Naranja familiar.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600' },
  { name: 'Agua 1.5L', price: 340, description: 'Agua mineral natural embotellada.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1560012206-8d197cca814c?w=600' },

  // Abarrotes
  { name: 'Paquete de Arroz 1kg', price: 660, description: 'Paquete de arroz de grano entero 1kg.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600' },
  { name: 'Paquete de Frijoles 1kg', price: 830, description: 'Paquete de frijoles negros seleccionados 1kg.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=600' },
  { name: 'Paquete de Azúcar 1kg', price: 980, description: 'Paquete de azúcar blanca refinada 1kg.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1581781881951-e73796d1947b?w=600' },
  { name: 'Paquete de Avena 1lb', price: 830, description: 'Avena en hojuelas paquete de 1lb.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=600' },
  { name: 'Paquete de Chícharos verdes 1lb', price: 800, description: 'Chícharos verdes secos seleccionados 1lb.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=600' },
  { name: 'Paquete de Garbanzos 1lb', price: 850, description: 'Garbanzos seleccionados ideales para guisados.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1547058881-aa0edd92aab3?w=600' },
  { name: 'Paquete de Café Roche', price: 1000, description: 'Café Roche aromático y fuerte.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600', badge: 'POPULAR' },
  { name: 'Paquete de Galletas de soda', price: 215, description: 'Galletas de soda crujientes ideales para merendar.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=600' },
  { name: 'Paquete de Gelatina', price: 350, description: 'Gelatina de sabores variados.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600' },
  { name: 'Paquete de Espaguetis', price: 260, description: 'Pasta de espaguetis de sémola de trigo.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=600' },
  { name: 'Pomo de Pasta de tomate', price: 580, description: 'Pasta de tomate concentrada para salsas.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600' },
  { name: 'Pomo de Mayonesa Celorrio', price: 1840, description: 'Mayonesa Celorrio cremosa y de gran sabor.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1570145820259-b5b80c5c8bd6?w=600' },
  { name: 'Pomo de Vinagre 1L', price: 300, description: 'Vinagre blanco ideal para ensaladas y sazonar.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=600' },
  { name: 'Pomo de Vino seco 1L', price: 300, description: 'Vino seco de cocina 1L para tus mejores guisados.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600' },
  { name: 'Lata de Leche evaporada', price: 690, description: 'Leche evaporada cremosa para postres y café.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600' },
  { name: 'Lata de Fanguito', price: 600, description: 'Dulce de leche condensada cocinada (fanguito).', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1600431521340-491eca880813?w=600' },
  { name: 'Barra de Queso Crema', price: 1530, description: 'Queso crema suave y untable.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=600' },
  { name: 'Lata de Atún', price: 550, description: 'Atún desmenuzado en aceite vegetal.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600' },
  { name: 'Lata de Sardinas', price: 820, description: 'Sardinas en salsa de tomate.', category: 'Mercado', image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600' }
];

async function main() {
  try {
    console.log("Connecting to Supabase...");
    
    // 1. Delete combo items to prevent foreign key errors
    console.log("Deleting combo items...");
    const { error: err1 } = await supabase.from('combo_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (err1) console.warn("Note deleting combo_items:", err1.message);

    // 2. Delete products
    console.log("Deleting existing products...");
    const { error: err2 } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (err2) throw err2;
    console.log("Deleted current products successfully.");

    // 3. Insert new products
    console.log(`Inserting ${newProducts.length} new products...`);
    const { data, error: err3 } = await supabase.from('products').insert(
      newProducts.map(p => ({
        ...p,
        active: true,
        stock: 99
      }))
    ).select();

    if (err3) throw err3;
    console.log(`Successfully added ${data.length} products to database!`);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main();
