import { render, screen } from '@testing-library/react';

// Un componente súper básico solo para probar la configuración
const TituloPrueba = () => <h1>¡Vitest está funcionando!</h1>;

describe('Configuración inicial de pruebas', () => {
  it('debería renderizar el componente correctamente', () => {
    // 1. Renderizamos el componente en nuestro DOM simulado
    render(<TituloPrueba />);
    
    // 2. Buscamos el elemento en la pantalla
    const titulo = screen.getByText('¡Vitest está funcionando!');
    
    // 3. Afirmamos que el elemento existe en el documento
    expect(titulo).toBeInTheDocument();
  });
});