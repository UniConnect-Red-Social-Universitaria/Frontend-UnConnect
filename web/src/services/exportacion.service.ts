import { apiClient } from '../api/apiClient';

class ExportacionService {
	private getBaseUrl(): string {
		try { return apiClient.getBaseUrl(); } catch { return 'http://localhost:3000'; }
	}

	private async getAuthHeaders(): Promise<Record<string, string>> {
		const token = await apiClient.getToken();
		return {
			Authorization: `Bearer ${token || ''}`,
		};
	}

	async descargarCSV(sprintId: string, tipo: 'historias' | 'criterios' | 'impedimentos'): Promise<void> {
		const headers = await this.getAuthHeaders();
		const url = `${this.getBaseUrl()}/api/scrum/sprints/${sprintId}/exportar/${tipo}.csv`;

		const response = await fetch(url, { headers });
		if (!response.ok) throw new Error('Error al descargar CSV');

		const blob = await response.blob();
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = `${tipo}-sprint-${sprintId}.csv`;
		link.click();
		URL.revokeObjectURL(link.href);
	}

	async descargarPDF(
		sprintId: string,
		opciones?: { trazabilidad?: boolean; retrospectiva?: boolean; impedimentos?: boolean }
	): Promise<void> {
		const headers = await this.getAuthHeaders();
		let url = `${this.getBaseUrl()}/api/scrum/sprints/${sprintId}/exportar/reporte.pdf`;

		if (opciones) {
			const params = new URLSearchParams();
			if (opciones.trazabilidad) params.set('trazabilidad', 'true');
			if (opciones.retrospectiva) params.set('retrospectiva', 'true');
			if (opciones.impedimentos) params.set('impedimentos', 'true');
			const qs = params.toString();
			if (qs) url += `?${qs}`;
		}

		const response = await fetch(url, { headers });
		if (!response.ok) throw new Error('Error al descargar PDF');

		const blob = await response.blob();
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = `reporte-sprint-${sprintId}.pdf`;
		link.click();
		URL.revokeObjectURL(link.href);
	}
}

export const exportacionService = new ExportacionService();
