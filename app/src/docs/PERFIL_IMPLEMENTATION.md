# Implementación del Sistema de Perfil con Patrón Decorator

## 📋 Resumen

Se ha implementado un sistema completo de visualización de perfil de usuario que consume los endpoints del backend con el patrón Decorator. El componente soporta carga condicional de datos enriquecidos sin impacto en rendimiento.

---

## 🏗️ Estructura Creada

### 1. **Tipos TypeScript** (`src/types/api.types.ts`)

```typescript
// Datos básicos del perfil (público)
export interface PerfilBaseDTO {
  id: string;
  nombre: string;
  apellido: string;
  carrera: string;
  semestre: number | null;
  asignaturasActivas: string[];
}

// Estadísticas del usuario (enriquecido)
export interface EstadisticasPerfil {
  gruposCreados: number;
  gruposParticipa: number;
  mensajesEnviados: number;
}

// Insignias calculadas automáticamente
export type Insignia = 'fundador' | 'participante-activo' | 'comunicador' | 'colaborador';

// Perfil completo con decoradores
export interface PerfilEnriquecido extends PerfilBaseDTO {
  estadisticas: EstadisticasPerfil;
  insignias: Insignia[];
}
```

### 2. **Servicio** (`src/services/perfil.service.ts`)

Encapsula la lógica de consumo de endpoints:

```typescript
class PerfilService {
  // Obtiene perfil base (público, sin JWT)
  async obtenerPerfilBase(usuarioId: string): Promise<PerfilBaseDTO>
  
  // Obtiene perfil completo (requiere JWT)
  async obtenerPerfilEnriquecido(usuarioId: string): Promise<PerfilEnriquecido>
  
  // Alternativa: obtiene perfil con query parameter
  async obtenerPerfilConVista(usuarioId: string, vista?: string): Promise<PerfilBaseDTO>
}
```

**Características:**
- ✅ Manejo de JWT automático
- ✅ Gestión de errores consistente
- ✅ Tipos fuertemente tipados

### 3. **Hook Personalizado** (`src/hooks/usePerfil.ts`)

Gestiona la lógica de carga condicional:

```typescript
const {
  perfilBase,           // Datos básicos cargados
  perfilEnriquecido,    // Datos completos (null si no expandido)
  cargandoBase,         // Estado de carga del perfil base
  cargandoEnriquecido,  // Estado de carga de datos enriquecidos
  expandido,            // Indica si está expandido
  errorBase,            // Error al cargar base
  errorEnriquecido,     // Error al cargar enriquecido
  cargarPerfilBase,     // Función para cargar base
  expandirPerfil,       // Función para expandir y cargar datos
  contraerPerfil,       // Función para contraer
} = usePerfil();
```

**Comportamiento:**
1. No carga nada automáticamente
2. Llamar `cargarPerfilBase(usuarioId)` para cargar datos básicos
3. Llamar `expandirPerfil(usuarioId)` para cargar datos enriquecidos
4. Llamar `contraerPerfil()` para ocultar datos enriquecidos
5. Cachea datos enriquecidos para no recargar

### 4. **Componente Visual** (`src/components/PerfilCard.tsx`)

Tarjeta de perfil reutilizable con expansión:

```typescript
<PerfilCard 
  usuarioId="usuario-001"
  onClose={() => setMostrarPerfil(false)}
/>
```

**Características Visuales:**
- 👤 Avatar con iniciales del usuario
- 📚 Información básica: nombre, carrera, semestre
- 📋 Lista de asignaturas activas (badges verdes)
- 📊 Botón "Ver Estadísticas" para expandir
- 📈 Estadísticas en grid (3 columnas)
- 🏆 Insignias desbloqueadas con emojis
- 🎨 Diseño responsive y moderno
- ⚠️ Manejo de errores con mensajes claros

### 5. **Pantalla de Demostración** (`src/screens/VistaPerfilScreen.tsx`)

Pantalla de ejemplo que demuestra cómo usar el componente.

---

## 🎯 Flujo de Uso

### Escenario 1: Ver Perfil Público (sin autenticación)

```typescript
import { PerfilCard } from '@/components/PerfilCard';

export function MiPantalla() {
  return (
    <PerfilCard 
      usuarioId="usuario-001"
      onClose={() => navigation.goBack()}
    />
  );
}
```

**Qué sucede:**
1. ✅ Se carga el perfil base (nombre, carrera, semestre, asignaturas)
2. ✅ Se muestra información básica
3. ✅ Botón "Ver Estadísticas" permite expandir
4. ✅ Al expandir, se carga perfil enriquecido (requiere JWT)

### Escenario 2: Uso Manual del Hook

```typescript
import { usePerfil } from '@/hooks/usePerfil';
import { perfilService } from '@/services';

export function PantallaPersonalizada() {
  const {
    perfilBase,
    perfilEnriquecido,
    expandido,
    cargarPerfilBase,
    expandirPerfil,
  } = usePerfil();

  useEffect(() => {
    cargarPerfilBase('usuario-001');
  }, []);

  return (
    <View>
      {perfilBase && (
        <>
          <Text>{perfilBase.nombre}</Text>
          <Button 
            title="Mostrar Estadísticas"
            onPress={() => expandirPerfil('usuario-001')}
          />
        </>
      )}
      
      {expandido && perfilEnriquecido && (
        <View>
          <Text>Grupos Creados: {perfilEnriquecido.estadisticas.gruposCreados}</Text>
          <Text>Insignias: {perfilEnriquecido.insignias.join(', ')}</Text>
        </View>
      )}
    </View>
  );
}
```

### Escenario 3: Consumo Directo del Servicio

```typescript
import { perfilService } from '@/services';

async function obtenerDatos() {
  try {
    // Obtener base (rápido, público)
    const base = await perfilService.obtenerPerfilBase('usuario-001');
    console.log(base.nombre); // Laura

    // Obtener enriquecido bajo demanda (requiere JWT)
    const completo = await perfilService.obtenerPerfilEnriquecido('usuario-001');
    console.log(completo.estadisticas); // { gruposCreados: 2, ... }
  } catch (error) {
    console.error('Error:', error);
  }
}
```

---

## 🔐 Autenticación

### Endpoints Públicos
- `GET /api/usuarios/perfil/:id` → No requiere JWT
- `GET /api/usuarios/perfil/:id?vista=completa` → No requiere JWT

### Endpoints Protegidos
- `GET /api/usuarios/perfil/:id/estadisticas` → **Requiere JWT**

El servicio maneja automáticamente el JWT:

```typescript
// El hook/servicio usa apiClient.authenticatedRequest
// que añade automáticamente el header Authorization: Bearer <token>
const perfil = await perfilService.obtenerPerfilEnriquecido(usuarioId);
```

---

## 💾 Gestión de Estado

### Estados Independientes

Los estados de carga son independientes para optimizar UX:

```typescript
// 1. Carga perfil base (rápido)
cargandoBase = true
↓
// 2. Muestra perfil base
perfilBase = { ... }
cargandoBase = false

// 3. Usuario hace clic en "Ver Estadísticas"
cargandoEnriquecido = true
↓
// 4. Muestra estadísticas e insignias
perfilEnriquecido = { ..., estadisticas, insignias }
cargandoEnriquecido = false
```

### Cacheo de Datos

```typescript
// Una vez cargado perfilEnriquecido, no se recarga
const expandirPerfil = useCallback(async (usuarioId: string) => {
  if (perfilEnriquecido) {
    setExpandido(true); // Solo expande, no recarga
    return;
  }
  
  // Solo carga si no está cacheado
  const perfilCompleto = await perfilService.obtenerPerfilEnriquecido(usuarioId);
  setPerfilEnriquecido(perfilCompleto);
  setExpandido(true);
}, [perfilEnriquecido]);
```

---

## 🎨 Personalización del Componente

### Cambiar Emojis de Insignias

En `PerfilCard.tsx`:

```typescript
const INSIGNIA_EMOJIS: Record<Insignia, string> = {
  fundador: "🏆",              // ← Cambiar aquí
  "participante-activo": "🔥",  // ← O aquí
  comunicador: "💬",
  colaborador: "🤝",
};
```

### Cambiar Colores

```typescript
const styles = StyleSheet.create({
  expandButton: {
    backgroundColor: "#6366f1",  // ← Color primario
    // ...
  },
  // ...
});
```

### Textos y Mensajes

Todos los textos están en el componente, modifica según necesidad:

```typescript
<TouchableOpacity onPress={() => expandirPerfil(usuarioId)}>
  <Text>Ver Estadísticas</Text>  // ← Modificable
</TouchableOpacity>
```

---

## 🧪 Casos de Prueba

### Caso 1: Cargar Perfil Básico

```typescript
// Entrada: usuarioId = "usuario-001"
// Esperado:
// - Se muestra nombre, carrera, semestre
// - Se muestran asignaturas activas
// - Se muestra botón "Ver Estadísticas"
```

### Caso 2: Expandir Perfil

```typescript
// Acción: Hacer clic en "Ver Estadísticas"
// Esperado:
// - Se muestra spinner de carga
// - Se cargan estadísticas
// - Se muestran insignias desbloqueadas
// - Se cambia botón a "Contraer"
```

### Caso 3: Manejo de Errores

```typescript
// Entrada: usuarioId inválido
// Esperado:
// - Se muestra mensaje de error
// - Botón "Cerrar"

// Entrada: Sin token JWT y usuario intenta expandir
// Esperado:
// - Error 401 manejado
// - Mensaje de error informativo
```

### Caso 4: Token Expirado

```typescript
// Acción: Hacer clic en "Ver Estadísticas" con token expirado
// Esperado:
// - Se captura error 401
// - Se muestra: "Autenticación requerida"
// - Usuario puede re-autenticarse
```

---

## 📱 Integración en Rutas

### Agregar a Navigator

En `src/navigation/RootNavigator.tsx`:

```typescript
import VistaPerfilScreen from '../screens/VistaPerfilScreen';

// En el stack:
<Stack.Screen 
  name="VistaPerfil" 
  component={VistaPerfilScreen}
  options={{ title: 'Perfil del Estudiante' }}
/>

// Navegar:
navigation.navigate('VistaPerfil', { usuarioId: 'usuario-001' })
```

---

## ⚠️ Consideraciones Importantes

### 1. **Requiere JWT para Datos Enriquecidos**

El endpoint `/estadisticas` requiere autenticación. El componente maneja esto automáticamente, pero asegúrate de:

```typescript
// El apiClient debe estar correctamente configurado
await apiClient.setToken(jwtToken);
```

### 2. **Manejo de Token Expirado**

Si el token expira mientras está expandido:

```typescript
// El servicio lanzará error 401
// El componente mostrará: "No se pudo obtener el perfil enriquecido"
// Usuario debe re-autenticarse
```

### 3. **Performance**

- ✅ Perfil base es rápido (caché en backend)
- ✅ Perfil enriquecido es más lento (calcula estadísticas)
- ✅ Se cachea en frontend para no recargar

### 4. **Red Lenta**

Si hay latencia alta:

```typescript
// Muestra spinner mientras carga
// Botón deshabilitado durante carga: disabled={cargandoEnriquecido}
// Puedes aumentar timeouts en apiClient si es necesario
```

---

## 📚 Archivos Modificados

- ✅ `app/src/types/api.types.ts` - Tipos agregados
- ✅ `app/src/services/perfil.service.ts` - Servicio creado
- ✅ `app/src/services/index.ts` - Exportaciones actualizadas
- ✅ `app/src/hooks/usePerfil.ts` - Hook creado
- ✅ `app/src/components/PerfilCard.tsx` - Componente creado
- ✅ `app/src/screens/VistaPerfilScreen.tsx` - Pantalla de demostración

---

## 🚀 Próximos Pasos

1. **Integrar en rutas de navegación**
   ```typescript
   // Agregar VistaPerfilScreen o PerfilCard en RootNavigator
   ```

2. **Conectar desde otras pantallas**
   ```typescript
   // Desde GruposScreen, ContactScreen, etc.
   navigation.navigate('VistaPerfil', { usuarioId });
   ```

3. **Agregar a exportaciones principales**
   ```typescript
   // app/src/index.ts o index barril
   export { PerfilCard } from './components/PerfilCard';
   export { usePerfil } from './hooks/usePerfil';
   ```

4. **Testing**
   - Probar con diferentes IDs de usuario
   - Probar con token expirado
   - Probar con usuario que no existe (404)
   - Probar con conexión lenta

---

## ✅ Checklist de Implementación

- [x] Tipos TypeScript definidos
- [x] Servicio creado y exportado
- [x] Hook personalizado creado
- [x] Componente visual creado
- [x] Pantalla de demostración creada
- [x] Manejo de errores implementado
- [x] Estados de carga implementados
- [x] Documentación completa
- [ ] Integración en rutas (pendiente)
- [ ] Testing (pendiente)
- [ ] Casos de error probados (pendiente)

---

## 🎓 Conceptos Implementados

### Patrón Decorator
```
PerfilBase (datos básicos)
    ↓
PerfilConEstadisticas (agrega estadísticas) ← /estadisticas
    ↓
PerfilConInsignias (agrega insignias calculadas)
```

### Lazy Loading
```
Vista Cerrada → Mostrar Base (rápido)
                     ↓
                Usuario Expande
                     ↓
            Cargar Enriquecido (más lento)
```

### Manejo de Errores Granular
```
- Error al cargar base → Pantalla de error
- Error al cargar enriquecido → Aviso dentro del componente
- Token expirado → Mantiene base, muestra error al expandir
```

---

## 📞 Soporte

Para problemas comunes:

1. **"No se pudo obtener el perfil base"**
   - Verifica que el ID de usuario sea válido
   - Comprueba que el backend esté funcionando

2. **"Autenticación requerida" (401)**
   - Verifica que el token JWT sea válido
   - Comprueba que no haya expirado
   - Re-autentica al usuario

3. **Perfil expandido pero sin insignias**
   - Verifica que las estadísticas cumplan requisitos
   - `fundador`: 1+ grupos creados
   - `participante-activo`: 3+ grupos
   - `comunicador`: 10+ mensajes
   - `colaborador`: En todo (crear, participar, mensajear)
