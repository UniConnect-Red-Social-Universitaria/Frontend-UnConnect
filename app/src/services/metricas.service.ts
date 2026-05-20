import { apiClient } from './api.client';
import { MetricasSprint, BurnDownData, CumplimientoSprint, VelocidadHistorica } from '../types/api.types';

class MetricasService {
    async obtenerMetricasSprint(sprintId: string): Promise<MetricasSprint> {
        const response = await apiClient.get<MetricasSprint>(`/api/scrum/sprints/${sprintId}/metricas`);
        return response.data!;
    }

    async obtenerBurndown(sprintId: string): Promise<BurnDownData> {
        const response = await apiClient.get<BurnDownData>(`/api/scrum/sprints/${sprintId}/burndown`);
        return response.data!;
    }

    async obtenerCumplimiento(sprintId: string): Promise<CumplimientoSprint> {
        const response = await apiClient.get<CumplimientoSprint>(`/api/scrum/sprints/${sprintId}/cumplimiento`);
        return response.data!;
    }

    async velocidadHistorica(): Promise<VelocidadHistorica[]> {
        const response = await apiClient.get<VelocidadHistorica[]>('/api/scrum/metricas/velocidad-historica');
        return response.data || [];
    }
}

export const metricasService = new MetricasService();
