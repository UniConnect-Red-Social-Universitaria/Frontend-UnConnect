import { apiClient } from './api.client';
import { Linking, Platform } from 'react-native';

class ExportacionService {
    async descargarCSV(sprintId: string, tipo: 'historias' | 'criterios' | 'impedimentos'): Promise<void> {
        const baseUrl = this.getBaseUrl();
        const token = await apiClient.getToken();
        const url = `${baseUrl}/api/scrum/sprints/${sprintId}/exportar/${tipo}.csv?token=${token || ''}`;
        await Linking.openURL(url);
    }

    async descargarPDF(
        sprintId: string,
        opciones?: { trazabilidad?: boolean; retrospectiva?: boolean; impedimentos?: boolean }
    ): Promise<void> {
        const baseUrl = this.getBaseUrl();
        const token = await apiClient.getToken();
        let url = `${baseUrl}/api/scrum/sprints/${sprintId}/exportar/reporte.pdf?token=${token || ''}`;
        if (opciones) {
            if (opciones.trazabilidad) url += '&trazabilidad=true';
            if (opciones.retrospectiva) url += '&retrospectiva=true';
            if (opciones.impedimentos) url += '&impedimentos=true';
        }
        await Linking.openURL(url);
    }

    private getBaseUrl(): string {
        try { return apiClient.getBaseUrl(); } catch { return 'http://localhost:3000'; }
    }
}

export const exportacionService = new ExportacionService();
