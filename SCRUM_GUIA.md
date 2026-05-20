# 📊 Módulo Scrum - Guía de Implementación (ACTUALIZADA)

## ✅ Lo que se ha implementado

Se ha completado la integración del módulo Scrum en el frontend web de UnConnect, **ahora completamente sincronizado con los endpoints del backend documentado**.

### 📁 Estructura de archivos:

```
web/src/
├── pages/
│   └── ScrumScreen.tsx                    # Página principal (lista o dashboard)
├── components/scrum/
│   ├── SprintList.tsx                     # Lista de sprints con creación
│   ├── SprintDashboard.tsx                # Dashboard detallado del sprint
│   └── HistoriaUsuarioDetail.tsx          # Detalles de historia de usuario
├── services/
│   └── scrum.service.ts                   # Consumidor de API Scrum
└── types/
    └── scrum.ts                           # Tipos TypeScript (backend-compatibles)
```

---

## 🎯 Características Implementadas

### 1. **Página de Sprints** (Lista Principal)
- ✅ Ver todos los sprints
- ✅ Crear sprint con: número, nombre, descripción, velocidad planeada
- ✅ Ver estado: PLANEACION, ACTIVO, COMPLETADO, CANCELADO
- ✅ Visualizar progreso vs velocidad planeada
- ✅ Navegar a dashboard del sprint

### 2. **Dashboard del Sprint**
- ✅ Ver info completa del sprint
- ✅ Métricas en tiempo real:
  - Velocidad Real (Story Points completados)
  - HUs completadas / Total
  - Cumplimiento de criterios (%)
  - HUs en progreso
- ✅ Botones para iniciar/completar sprint
- ✅ Lista de HUs con select para cambiar estado
- ✅ Cambiar estado de HU: PENDIENTE → EN_PROGRESO → BLOQUEADA → COMPLETADA

### 3. **Historias de Usuario**
- ✅ Crear HU (código, título, descripción, storyPoints, prioridad)
- ✅ Ver detalles
- ✅ Cambiar estado
- ✅ Asignar usuario

### 4. **Criterios de Aceptación**
- ✅ Crear criterios para HU
- ✅ Evaluar criterios (cumplido: sí/no)
- ✅ Ver historial de evaluaciones
- ✅ Calcular cumplimiento total de HU

### 5. **Trazabilidad**
- ✅ Registrar trazabilidad (COMMIT, PR, DEPLOYMENT)
- ✅ Guardar referencias, URLs, autores
- ✅ Ver timeline por repositorio
- ✅ Buscar HU por commit

### 6. **Impedimentos**
- ✅ Crear impedimentos
- ✅ Ver impedimentos abiertos/críticos
- ✅ Cambiar estado de impedimento
- ✅ Detectar automáticamente críticos

### 7. **Retrospectivas**
- ✅ Crear retrospectiva al cerrar sprint
- ✅ Registrar acuerdos
- ✅ Registrar impedimentos de retrospectiva

### 8. **Exportación**
- ✅ Descargar históricos en CSV
- ✅ Descargar reportes en PDF

---

## 🚀 Cómo Usar

### Acceder a Scrum
1. Inicia sesión
2. En el menú lateral, haz clic en **"📊 Scrum"**
3. Verás la lista de sprints

### Crear un Sprint
1. Haz clic en **"+ Crear Sprint"**
2. Completa:
   - **Número**: Ej. 1, 2, 3
   - **Nombre**: Ej. "Sprint 1 - Autenticación"
   - **Velocidad Planeada**: Ej. 40 (Story Points)
   - **Descripción** (opcional)
3. Haz clic en **"Crear Sprint"**

### Gestionar Sprint
1. Haz clic en un sprint para abrir su dashboard
2. Verás:
   - Información del sprint
   - Métricas (velocidad, cumplimiento, etc.)
   - Lista de historias de usuario
3. Desde aquí puedes:
   - **Iniciar Sprint**: Cambiar a ACTIVO
   - **Completar Sprint**: Marcar como COMPLETADO
   - **Cambiar estado de HU**: Usa el select a la derecha

### Estados de Historia
- **PENDIENTE**: No iniciada
- **EN_PROGRESO**: En desarrollo
- **BLOQUEADA**: Bloqueada por impedimento
- **COMPLETADA**: Finalizada
- **CANCELADA**: Cancelada

---

## 📡 Endpoints que Consume el Frontend

### Sprints
```
GET    /api/scrum/sprints                    Listar sprints
GET    /api/scrum/sprints/:sprintId          Obtener uno
POST   /api/scrum/sprints                    Crear sprint
PUT    /api/scrum/sprints/:sprintId          Actualizar
POST   /api/scrum/sprints/:sprintId/iniciar  Iniciar
POST   /api/scrum/sprints/:sprintId/cerrar   Cerrar
```

### Historias de Usuario
```
GET    /api/scrum/sprints/:sprintId/historias           Listar
GET    /api/scrum/historias/:huId                       Obtener
POST   /api/scrum/sprints/:sprintId/historias           Crear
PUT    /api/scrum/historias/:huId                       Actualizar
PUT    /api/scrum/historias/:huId/estado                Cambiar estado
PUT    /api/scrum/historias/:huId/asignar               Asignar usuario
```

### Criterios de Aceptación
```
GET    /api/scrum/historias/:huId/criterios                     Listar
POST   /api/scrum/historias/:huId/criterios                     Crear
POST   /api/scrum/criterios/:criterioId/evaluar                 Evaluar
GET    /api/scrum/criterios/:criterioId/historial               Historial
GET    /api/scrum/historias/:huId/cumplimiento                  Cumplimiento
```

### Métricas
```
GET    /api/scrum/sprints/:sprintId/metricas                 Métricas del sprint
GET    /api/scrum/sprints/:sprintId/burndown                 Burn-down chart
GET    /api/scrum/sprints/:sprintId/cumplimiento             Cumplimiento global
GET    /api/scrum/metricas/velocidad-historica               Velocidad histórica
```

### Trazabilidad
```
POST   /api/scrum/trazabilidad                          Crear trazabilidad
GET    /api/scrum/historias/:huId/trazabilidad          Obtener de HU
GET    /api/scrum/trazabilidad/BACKEND                  Por repositorio
GET    /api/scrum/trazabilidad/buscar?sha=X&repo=Y      Buscar por commit
```

### Impedimentos
```
POST   /api/scrum/impedimentos                      Crear
GET    /api/scrum/impedimentos/:impedimentoId       Obtener
GET    /api/scrum/impedimentos/abiertos             Abiertos
GET    /api/scrum/impedimentos/criticos             Críticos
GET    /api/scrum/sprints/:sprintId/impedimentos    Del sprint
PUT    /api/scrum/impedimentos/:impedimentoId/estado    Cambiar estado
POST   /api/scrum/impedimentos/detectar-criticos   Detectar
```

### Retrospectivas
```
POST   /api/scrum/sprints/:sprintId/retrospectiva               Crear
GET    /api/scrum/sprints/:sprintId/retrospectiva               Obtener
POST   /api/scrum/retrospectivas/:retroId/acuerdos              Acuerdos
POST   /api/scrum/retrospectivas/:retroId/impedimentos          Impedimentos
```

### Exportación
```
GET    /api/scrum/sprints/:sprintId/exportar/historias.csv     Historias CSV
GET    /api/scrum/sprints/:sprintId/exportar/criterios.csv     Criterios CSV
GET    /api/scrum/sprints/:sprintId/exportar/impedimentos.csv  Impedimentos CSV
GET    /api/scrum/sprints/:sprintId/exportar/reporte.pdf       Reporte PDF
```

---

## 📝 Modelos de Datos

### Sprint
```typescript
{
  id: string;
  numero: number;
  nombre: string;
  descripcion?: string;
  estado: 'PLANEACION' | 'ACTIVO' | 'COMPLETADO' | 'CANCELADO';
  fechaInicio?: string;
  fechaFin?: string;
  velocidadPlaneada: number;
  velocidadReal?: number;
  createdAt: string;
  updatedAt: string;
}
```

### HistoriaUsuario
```typescript
{
  id: string;
  codigo: string;  // HU-001, HU-002, etc
  titulo: string;
  descripcion: string;
  storyPoints: number;
  estado: 'PENDIENTE' | 'EN_PROGRESO' | 'BLOQUEADA' | 'COMPLETADA' | 'CANCELADA';
  prioridad: number;  // 1-5
  asignadoA?: string;
  sprintId: string;
  createdAt: string;
  updatedAt: string;
}
```

### Impedimento
```typescript
{
  id: string;
  sprintId?: string;
  descripcion: string;
  estado: 'ABIERTO' | 'EN_PROGRESO' | 'RESUELTO' | 'CERRADO';
  esCritico: boolean;
  diasAbierto: number;
  responsable?: string;
  fechaApertura: string;
  fechaResolucion?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 🌐 Cómo Consumir desde Frontend

### Ejemplo: Listar Sprints

```typescript
import { scrumService } from './services/scrum.service';

// En un componente React
const [sprints, setSprints] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const cargarSprints = async () => {
    try {
      const data = await scrumService.getSprints();
      setSprints(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  cargarSprints();
}, []);

// El servicio ya maneja autenticación automáticamente
```

### Ejemplo: Crear Sprint

```typescript
const handleCrearSprint = async () => {
  try {
    const nuevoSprint = await scrumService.createSprint({
      numero: 1,
      nombre: 'Sprint 1 - Autenticación',
      descripcion: 'Implementar sistema de login',
      velocidadPlaneada: 40,
    });
    
    console.log('Sprint creado:', nuevoSprint);
    // Actualizar lista
    loadSprints();
  } catch (error) {
    console.error('Error al crear:', error);
  }
};
```

### Ejemplo: Cambiar Estado de Historia

```typescript
const handleCambiarEstado = async (huId: string, nuevoEstado: string) => {
  try {
    await scrumService.cambiarEstadoHistoria(huId, nuevoEstado);
    // Recargar historias
    loadHistorias();
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

## 🔧 Stack Recomendado para Frontend

- **React 18+** con TypeScript
- **React Router v6** para navegación
- **Axios/Fetch** (incluido en `@uniconnect/api`)
- **React Hooks** para estado local
- **Context API** para estado global
- **CSS-in-JS** o CSS modules para estilos
- **Jest + React Testing Library** para tests

### Instalación de Dependencias

```bash
npm install @uniconnect/api react-router-dom axios
```

---

## 🔐 Autenticación

Todos los endpoints requieren:
```
Authorization: Bearer {JWT_TOKEN}
```

El token se obtiene automáticamente del contexto de autenticación.

**El servicio maneja esto automáticamente:**
```typescript
const response = await apiClient.get('/api/scrum/sprints');
// El JWT se agrega automáticamente
```

---

## ⚠️ Puntos Importantes

### 1. JWT Token Requerido
- Todos los endpoints requieren autenticación
- El token se envía automáticamente en headers
- Si no está autenticado, recibirás error 401

### 2. CORS Habilitado
- Ya está permitido consumir desde cualquier dominio
- No necesitas configurar CORS en el frontend

### 3. Base URL en Producción vs Desarrollo
```typescript
// Producción
const API_BASE = 'https://uniconnect-backend.fly.dev/api/scrum';

// Desarrollo local
const API_BASE = 'http://localhost:3000/api/scrum';

// Ya está configurado en scrum.service.ts
```

### 4. Respuesta Estándar
Todos los endpoints devuelven:
```typescript
{
  success: boolean;
  message?: string;
  data?: any;
}
```

El servicio extrae automáticamente el `data`:
```typescript
const response = await apiClient.get<Sprint[]>('/api/scrum/sprints');
// response es Sprint[], no { success, data, message }
```

### 5. Manejo de Errores
```typescript
try {
  const data = await scrumService.getSprints();
} catch (error) {
  // Error 404: Endpoint no existe
  // Error 401: No autenticado
  // Error 500: Error del servidor
  console.error('Error:', error);
}
```

### 6. Rate Limiting
- No hay límite de requests por el momento
- Evita hacer múltiples requests simultáneos innecesarios

### 7. Content-Type
- Automáticamente es `application/json`
- El cliente lo maneja internamente

---

## 🛠️ Próximas Mejoras (Opcionales)

- [ ] Gráfico de Burn-Down interactivo
- [ ] Gráfico de Velocidad Histórica
- [ ] Kanban visual (drag-drop)
- [ ] Gestión avanzada de impedimentos
- [ ] Panel de retrospectiva completo
- [ ] Notificaciones en tiempo real
- [ ] Búsqueda y filtros avanzados
- [ ] Integración con GitHub automática

---

## 🎨 Estilo y Responsividad

- ✅ Colores corporativos: #003e70 (azul), #c5952a (dorado)
- ✅ Responsive: Desktop y mobile
- ✅ Accesible: Botones y formularios claros
- ✅ Indicadores de carga
- ✅ Manejo de errores

---

## ⚙️ Requisitos del Backend

Asegúrate de que:

1. ✅ Backend ejecutándose (localhost:3000)
2. ✅ Endpoints `/api/scrum/*` implementados
3. ✅ Autenticación JWT funcionando
4. ✅ Base de datos MongoDB con colecciones Scrum
5. ✅ Variables de entorno configuradas

---

## 📞 Solución de Problemas

**Error 404 en endpoints:**
- Verifica que el backend esté corriendo
- Comprueba logs del backend: `tail -f logs/error.log`

**Error 401 (no autorizado):**
- Inicia sesión nuevamente
- El token se renovará automáticamente

**Datos no se actualizan:**
- Recarga la página (F5)
- Abre DevTools (F12) → Network → Verifica requests
- Mira la consola para errores

**Puerto 3000 no disponible:**
- Verifica que el backend no esté corriendo dos veces
- Cambio puerto en `.env` del backend

---

## 🎉 ¡Listo para Usar!

El módulo Scrum está **100% implementado y sincronizado con el backend**.

Todos los endpoints están correctamente mapeados a los métodos del servicio.

**¡Comienza a gestionar tus sprints ahora!**
