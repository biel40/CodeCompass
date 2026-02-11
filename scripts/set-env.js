/**
 * Script para inyectar variables de entorno en los archivos de environment
 * Se ejecuta antes del build/start
 *
 * Uso:
 *   node scripts/set-env.js          # Genera ambos environments
 *   node scripts/set-env.js --dev    # Solo environment.ts (desarrollo)
 *   node scripts/set-env.js --prod   # Solo environment.prod.ts (producción)
 *
 * Requiere las siguientes variables de entorno:
 * - SUPABASE_URL
 * - SUPABASE_ANON_KEY
 */

const fs = require('fs');
const path = require('path');

// Parsear argumentos
const args = process.argv.slice(2);
const devOnly = args.includes('--dev');
const prodOnly = args.includes('--prod');
const generateDev = !prodOnly;
const generateProd = !devOnly;

// Cargar .env si existe (para desarrollo local)
const dotenvPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(dotenvPath)) {
  const envContent = fs.readFileSync(dotenvPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const trimmedLine = line.trim();
    // Ignorar líneas vacías y comentarios
    if (!trimmedLine || trimmedLine.startsWith('#')) return;

    const [key, ...valueParts] = trimmedLine.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value;
      }
    }
  });
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Faltan variables de entorno requeridas');
  console.error('   - SUPABASE_URL:', supabaseUrl ? '✓' : '✗ (falta)');
  console.error('   - SUPABASE_ANON_KEY/SUPABASE_KEY:', supabaseAnonKey ? '✓' : '✗ (falta)');
  console.error('\n📝 Pasos para configurar:');
  console.error('   1. Copia .env.example a .env');
  console.error('   2. Completa las variables con tus credenciales de Supabase');
  console.error('   3. Ejecuta el comando de nuevo');
  console.error('\n📖 Lee SUPABASE_SETUP.md para más información');
  process.exit(1);
}

// ⚠️ Validación de seguridad: Detectar si se está usando una secret key
if (supabaseAnonKey.includes('sb_secret_') || supabaseAnonKey.includes('service_role')) {
  console.error('\n🚨 ERROR CRÍTICO DE SEGURIDAD 🚨');
  console.error('═══════════════════════════════════════════════════════════');
  console.error('❌ Estás usando una SECRET KEY en lugar de la ANON KEY');
  console.error('');
  console.error('La clave que configuraste:');
  console.error(`   ${supabaseAnonKey.substring(0, 30)}...`);
  console.error('');
  console.error('⚠️  Las SECRET KEYS:');
  console.error('   - Tienen acceso completo sin restricciones RLS');
  console.error('   - NUNCA deben usarse en el navegador');
  console.error('   - Exponen tu base de datos completamente');
  console.error('');
  console.error('✅ Debes usar la ANON/PUBLIC KEY:');
  console.error('   - Se encuentra en: Dashboard → Settings → API');
  console.error('   - Etiquetada como "anon" o "public"');
  console.error('   - Empieza con: eyJh...');
  console.error('   - Es segura para el navegador');
  console.error('');
  console.error('📖 Lee SUPABASE_SETUP.md para instrucciones detalladas');
  console.error('═══════════════════════════════════════════════════════════\n');
  process.exit(1);
}

const environmentsDir = path.resolve(__dirname, '../src/environments');

// Generar environment.ts (desarrollo)
if (generateDev) {
  const devEnvFile = `// ⚠️ ARCHIVO GENERADO AUTOMÁTICAMENTE - NO EDITAR
// Ejecuta "npm run env" para regenerar desde variables de entorno
export const environment = {
  production: false,
  useMocks: false,
  supabase: {
    url: '${supabaseUrl}',
    anonKey: '${supabaseAnonKey}',
  },
};
`;
  fs.writeFileSync(path.join(environmentsDir, 'environment.ts'), devEnvFile);
  console.log('✅ environment.ts generado');
}

// Generar environment.prod.ts (producción)
if (generateProd) {
  const prodEnvFile = `// ⚠️ ARCHIVO GENERADO AUTOMÁTICAMENTE - NO EDITAR
// Ejecuta "npm run env" para regenerar desde variables de entorno
export const environment = {
  production: true,
  useMocks: false,
  supabase: {
    url: '${supabaseUrl}',
    anonKey: '${supabaseAnonKey}',
  },
};
`;
  fs.writeFileSync(path.join(environmentsDir, 'environment.prod.ts'), prodEnvFile);
  console.log('✅ environment.prod.ts generado');
}

console.log(`\n📦 Configuración de Supabase:`);
console.log(`   - URL: ${supabaseUrl.substring(0, 35)}...`);
console.log(`   - API Key: ${supabaseAnonKey.substring(0, 20)}...`);
