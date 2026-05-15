// Ejemplos de integración del sistema de Perfil
// Copia y adapta según tus necesidades

// ============================================
// EJEMPLO 1: Integración Simple en una Pantalla
// ============================================

import React from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { PerfilCard } from '@/components/PerfilCard';
import { RootStackParamList } from '@/navigation/RootNavigator';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'MiPantalla'>;
  route: RouteProp<RootStackParamList, 'MiPantalla'>;
};

export function MiPantallaConPerfil({ navigation, route }: Props) {
  const { usuarioId } = route.params;

  return (
    <PerfilCard 
      usuarioId={usuarioId}
      onClose={() => navigation.goBack()}
    />
  );
}


// ============================================
// EJEMPLO 2: Uso del Hook en Componente Custom
// ============================================

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { usePerfil } from '@/hooks/usePerfil';

export function ComponentePerfilCustom({ usuarioId }: { usuarioId: string }) {
  const {
    perfilBase,
    perfilEnriquecido,
    cargandoBase,
    cargandoEnriquecido,
    expandido,
    errorBase,
    cargarPerfilBase,
    expandirPerfil,
    contraerPerfil,
  } = usePerfil();

  // Cargar al montar
  useEffect(() => {
    cargarPerfilBase(usuarioId);
  }, [usuarioId, cargarPerfilBase]);

  // Renderizar
  if (cargandoBase) return <Text>Cargando...</Text>;
  if (errorBase) return <Text>Error: {errorBase}</Text>;
  if (!perfilBase) return <Text>No encontrado</Text>;

  return (
    <View>
      {/* Información Básica - siempre visible */}
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
        {perfilBase.nombre} {perfilBase.apellido}
      </Text>
      <Text>{perfilBase.carrera}</Text>

      {/* Botón para expandir */}
      {!expandido && (
        <TouchableOpacity 
          onPress={() => expandirPerfil(usuarioId)}
          disabled={cargandoEnriquecido}
        >
          <Text>{cargandoEnriquecido ? 'Cargando...' : 'Ver Más'}</Text>
        </TouchableOpacity>
      )}

      {/* Contenido Expandido */}
      {expandido && perfilEnriquecido && (
        <View>
          <Text>Grupos Creados: {perfilEnriquecido.estadisticas.gruposCreados}</Text>
          <Text>Participa en: {perfilEnriquecido.estadisticas.gruposParticipa}</Text>
          <Text>Insignias: {perfilEnriquecido.insignias.join(', ')}</Text>
          
          <TouchableOpacity onPress={contraerPerfil}>
            <Text>Contraer</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}


// ============================================
// EJEMPLO 3: Desde GruposScreen - Mostrar Perfil de Miembro
// ============================================

import React, { useState } from 'react';
import { FlatList, TouchableOpacity } from 'react-native';
import { PerfilCard } from '@/components/PerfilCard';

export function MiembrosLista({ miembros }: { miembros: any[] }) {
  const [perfilVisibleId, setPerfilVisibleId] = useState<string | null>(null);

  // Si se está mostrando un perfil, renderizar solo eso
  if (perfilVisibleId) {
    return (
      <PerfilCard 
        usuarioId={perfilVisibleId}
        onClose={() => setPerfilVisibleId(null)}
      />
    );
  }

  // Lista de miembros
  return (
    <FlatList
      data={miembros}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => setPerfilVisibleId(item.id)}>
          <Text>{item.nombre} {item.apellido}</Text>
        </TouchableOpacity>
      )}
    />
  );
}


// ============================================
// EJEMPLO 4: Consumo Directo del Servicio
// ============================================

import React, { useEffect, useState } from 'react';
import { perfilService } from '@/services';
import { PerfilEnriquecido } from '@/types/api.types';

export function ComponeneteConServicio({ usuarioId }: { usuarioId: string }) {
  const [perfil, setPerfil] = useState<PerfilEnriquecido | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const cargarPerfil = async () => {
    try {
      setCargando(true);
      setError('');
      
      // Cargar perfil enriquecido directamente
      const datos = await perfilService.obtenerPerfilEnriquecido(usuarioId);
      setPerfil(datos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPerfil();
  }, [usuarioId]);

  if (cargando) return <Text>Cargando...</Text>;
  if (error) return <Text>Error: {error}</Text>;
  if (!perfil) return <Text>Sin datos</Text>;

  return (
    <View>
      <Text>{perfil.nombre} - {perfil.carrera}</Text>
      <Text>Insignias: {perfil.insignias.join(', ')}</Text>
    </View>
  );
}


// ============================================
// EJEMPLO 5: En ContactScreen - Ver perfil de Contacto
// ============================================

import { PerfilCard } from '@/components/PerfilCard';

export function ListadoContactos({ contactos }: { contactos: any[] }) {
  const [contactoSeleccionado, setContactoSeleccionado] = useState<string | null>(null);

  if (contactoSeleccionado) {
    return (
      <PerfilCard 
        usuarioId={contactoSeleccionado}
        onClose={() => setContactoSeleccionado(null)}
      />
    );
  }

  return (
    <FlatList
      data={contactos}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => setContactoSeleccionado(item.id)}>
          <Text>{item.nombre} {item.apellido}</Text>
        </TouchableOpacity>
      )}
    />
  );
}


// ============================================
// EJEMPLO 6: Modal de Perfil
// ============================================

import React, { useState } from 'react';
import { Modal } from 'react-native';

export function PerfilModal({ 
  visible, 
  usuarioId, 
  onClose 
}: { 
  visible: boolean; 
  usuarioId: string; 
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide">
      <PerfilCard 
        usuarioId={usuarioId}
        onClose={onClose}
      />
    </Modal>
  );
}

// Uso:
// const [mostrarPerfil, setMostrarPerfil] = useState(false);
// const [usuarioId, setUsuarioId] = useState('');
// 
// <PerfilModal 
//   visible={mostrarPerfil}
//   usuarioId={usuarioId}
//   onClose={() => setMostrarPerfil(false)}
// />


// ============================================
// EJEMPLO 7: En DetalleGrupoScreen - Mostrar Miembros con Perfil
// ============================================

import { useState } from 'react';
import { FlatList, TouchableOpacity, View, Text } from 'react-native';

export function DetalleGrupoConPerfil({ grupo }: { grupo: any }) {
  const [perfilMostrado, setPerfilMostrado] = useState<string | null>(null);

  if (perfilMostrado) {
    return (
      <PerfilCard 
        usuarioId={perfilMostrado}
        onClose={() => setPerfilMostrado(null)}
      />
    );
  }

  return (
    <View>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{grupo.nombre}</Text>
      
      <Text style={{ marginTop: 16, fontWeight: '600' }}>Miembros:</Text>
      <FlatList
        data={grupo.miembros}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => setPerfilMostrado(item.id)}
            style={{
              padding: 10,
              borderBottomWidth: 1,
              borderBottomColor: '#e0e0e0'
            }}
          >
            <Text style={{ fontWeight: '500' }}>
              {item.nombre} {item.apellido}
            </Text>
            <Text style={{ fontSize: 12, color: '#999' }}>
              {item.carrera}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}


// ============================================
// EJEMPLO 8: Agregar a RootNavigator
// ============================================

/*
En src/navigation/RootNavigator.tsx:

import VistaPerfilScreen from '../screens/VistaPerfilScreen';

export type RootStackParamList = {
  Home: undefined;
  // ... otras pantallas
  VistaPerfil: { usuarioId: string };  // ← Agregar
};

function RootNavigator() {
  return (
    <Stack.Navigator>
      {/* ... otras pantallas */}
      
      <Stack.Screen
        name="VistaPerfil"
        component={VistaPerfilScreen}
        options={{
          title: 'Perfil del Estudiante',
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
}

// Navegar:
navigation.navigate('VistaPerfil', { usuarioId: 'usuario-001' })
*/


// ============================================
// EJEMPLO 9: Reutilizar la Tarjeta en Web
// ============================================

/*
Si tienes código web en web/src, puedes crear una versión
web del componente usando los mismos tipos y servicios:

web/src/components/PerfilCard.tsx

import React, { useEffect } from 'react';
import { usePerfil } from '../hooks/usePerfil';

export function PerfilCard({ usuarioId, onClose }: { usuarioId: string; onClose?: () => void }) {
  const { perfilBase, expandido, expandirPerfil, ... } = usePerfil();

  useEffect(() => {
    cargarPerfilBase(usuarioId);
  }, [usuarioId]);

  return (
    <div className="perfil-card">
      <div className="perfil-header">
        <h2>{perfilBase?.nombre}</h2>
        // ...
      </div>
    </div>
  );
}
*/


// ============================================
// TIPS Y MEJORES PRÁCTICAS
// ============================================

/*
1. SIEMPRE cargar perfil base cuando se monta el componente
   useEffect(() => {
     cargarPerfilBase(usuarioId);
   }, [usuarioId, cargarPerfilBase]);

2. Manejo de errores granular
   - Error en base → No mostrar nada
   - Error en enriquecido → Mostrar base + aviso

3. Cacheo inteligente
   - No recargues perfilEnriquecido si ya está cacheado
   - El hook lo hace automáticamente

4. Performance
   - Usa ListeView/FlatList para listas de perfiles
   - No renders innecesarios del componente

5. Accesibilidad
   - Asegúrate de que los botones sean clickeables (min 44pt)
   - Contraste suficiente en textos
   - Descripciones de insignias claras

6. Internacionalización (futura)
   - Los textos están en español, considera i18n después
   - Insignias pueden tener labels traducibles

7. Testeo
   - Mock del servicio perfilService en tests
   - Prueba carga base, enriquecida y errores
   - Verifica estados de carga
*/
