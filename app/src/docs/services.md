# Servicios API

## Estructura

```
services/
├── api.client.ts         # Cliente HTTP base con manejo de tokens
├── auth.service.ts       # Autenticación (login, registro, logout)
├── usuarios.service.ts   # Gestión de usuarios y contactos
├── grupos.service.ts     # CRUD de grupos
├── archivos.service.ts   # Subida y descarga de archivos
├── eventos.service.ts    # CRUD de eventos
├── materias.service.ts   # Catálogo de materias
└── index.ts             # Exportación centralizada
```

## Uso

### Importación

Importa los servicios desde el index centralizado:

```typescript
import { authService, usuariosService, gruposService } from '../services';
```

### Ejemplos

#### Autenticación

```typescript
import { authService } from '../services';

// Login
try {
	const { token, usuario } = await authService.login(correo, contrasena);
	console.log('Login exitoso:', usuario);
} catch (error) {
	console.error('Error en login:', error.message);
}

// Registro
try {
	await authService.registro({
		nombre: 'Juan',
		apellido: 'Pérez',
		correo: 'juan@ucaldas.edu.co',
		contrasena: '12345678',
		carrera: 'Ingeniería',
		semestre: 5,
		materiasCursando: ['Cálculo', 'Programación'],
	});
} catch (error) {
	console.error('Error en registro:', error.message);
}

// Logout
await authService.logout();
```

#### Usuarios

```typescript
import { usuariosService } from '../services';

// Obtener perfil
const perfil = await usuariosService.getPerfil();

// Obtener todos los usuarios
const usuarios = await usuariosService.getUsuarios();

// Enviar solicitud de contacto
await usuariosService.enviarSolicitud(receptorId);

// Obtener solicitudes recibidas
const solicitudes = await usuariosService.getSolicitudesRecibidas();

// Aceptar solicitud
await usuariosService.aceptarSolicitud(solicitudId);

// Obtener compañeros
const companeros = await usuariosService.getCompaneros();
```

#### Grupos

```typescript
import { gruposService } from '../services';

// Obtener grupos
const grupos = await gruposService.getGrupos();

// Crear grupo
await gruposService.crearGrupo({
	nombre: 'Estudio Cálculo',
	materiaId: 'materia-123',
});

// Unirse a grupo
await gruposService.unirseAGrupo(grupoId);

// Obtener miembros
const miembros = await gruposService.getMiembros(grupoId);
```

#### Archivos

```typescript
import { archivosService } from '../services';

// Obtener archivos de un grupo
const archivos = await archivosService.getArchivosPorGrupo(grupoId);

// Subir archivo
await archivosService.subirArchivo(grupoId, {
	uri: fileUri,
	name: 'documento.pdf',
	type: 'application/pdf',
});

// Descargar archivo (obtiene URL)
const url = await archivosService.descargarArchivo(archivoId);
```

#### Eventos

```typescript
import { eventosService } from '../services';

// Obtener eventos
const eventos = await eventosService.getEventos();

// Crear evento
await eventosService.crearEvento({
	titulo: 'Taller React Native',
	descripcion: 'Workshop de desarrollo móvil',
	fecha: '2026-03-15T10:00:00',
	ubicacion: 'Aula 301',
});

// Eliminar evento
await eventosService.eliminarEvento(eventoId);
```

## Manejo de Errores

Todos los servicios lanzan excepciones cuando ocurre un error. Usa try-catch:

```typescript
try {
	const usuarios = await usuariosService.getUsuarios();
} catch (error) {
	if (error instanceof Error) {
		Alert.alert('Error', error.message);
	}
}
```

## Autenticación Automática

El `apiClient` maneja automáticamente:

- Agregar el token JWT en los headers
- Almacenar y recuperar el token de AsyncStorage
- Limpiar el token en logout

No necesitas preocuparte por los tokens manualmente.

## Ventajas

✅ **Centralización**: Todo el código de API en un solo lugar  
✅ **Reutilización**: No duplicar código fetch en cada componente  
✅ **Mantenibilidad**: Cambios en endpoints solo en un lugar  
✅ **Tipado**: TypeScript para autocomplete y validación  
✅ **Manejo de errores**: Consistente en toda la app  
✅ **Testing**: Fácil de mockear para pruebas
