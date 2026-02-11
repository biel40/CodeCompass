# 🔐 Configuración de Supabase (Seguridad)

## ⚠️ IMPORTANTE: Tipos de claves

Supabase proporciona dos tipos de API keys. **Solo una es segura para el frontend:**

### ✅ anon/public key (Para el navegador)
- **Ubicación**: Dashboard → Settings → API → Project API keys → `anon` `public`
- **Formato**: Empieza con `eyJh...` (~200 caracteres)
- **Seguridad**: Segura para código público
- **Permisos**: Limitados por Row Level Security (RLS)
- **Uso**: Frontend (Angular, React, etc.)

### ❌ service_role key (Solo backend)
- **Ubicación**: Dashboard → Settings → API → Project API keys → `service_role`
- **Formato**: Puede empezar con `sb_secret_...` o `eyJh...` (dice "secret" en el dashboard)
- **Seguridad**: ⚠️ **NUNCA EXPONER EN EL NAVEGADOR**
- **Permisos**: Acceso completo, ignora RLS
- **Uso**: Solo en servidores backend seguros

## 📋 Pasos para configurar

### 1. Obtén las credenciales correctas

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia:
   - **Project URL** (ej: `https://xxxxx.supabase.co`)
   - **anon public** key (la primera, la más larga)

### 2. Configura el archivo .env

```bash
# Copia el ejemplo
cp .env.example .env
```

Edita `.env` y pega las credenciales:

```env
SUPABASE_URL=https://yuxynzdyshfbbvxbniao.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1eHluemR5c2hmYmJ2eGJuaWFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk1NzY0MzIsImV4cCI6MjAyNTE1MjQzMn0.xxxxxxxxxxxxxxxxx
```

### 3. Genera los archivos de environment

```bash
npm run env
# o simplemente
npm start
```

## 🔍 Cómo identificar la clave correcta

**Visual aid en el Dashboard de Supabase:**

```
Project API keys
├─ anon public          ← ✅ USA ESTA
│  eyJhbGciOiJIUzI1...
│  This key is safe to use in a browser
│
└─ service_role         ← ❌ NO ESTA
   eyJhbGciOiJIUzI1...
   This key has the ability to bypass RLS
```

## ❌ Errores comunes

### Error: "Forbidden use of secret API key in browser"
**Causa**: Estás usando la service_role key en lugar de la anon key
**Solución**: Verifica que la clave en `.env` es la etiquetada como "anon"

### Error: "Invalid API key"
**Causa**: La clave está incompleta o incorrecta
**Solución**: Copia la clave completa, son ~200 caracteres

### Error: "Invalid login credentials"
**Causa**: Credenciales incorrectas O email no confirmado
**Solución**: Verifica en Dashboard → Authentication → Users que el usuario tenga "Email Confirmed"

## 🚀 Producción (Vercel)

En Vercel, configura las variables de entorno:

1. Project Settings → Environment Variables
2. Agrega:
   - `SUPABASE_URL` = URL de tu proyecto
   - `SUPABASE_ANON_KEY` = anon key (la pública)
3. Redeploy

**Nunca** comitees las credenciales al repositorio.
