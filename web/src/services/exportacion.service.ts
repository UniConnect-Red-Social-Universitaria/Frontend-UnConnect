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

	private async descargarBlob(url: string, filename: string): Promise<void> {
		const headers: Record<string, string> = {
			...(await this.getAuthHeaders()),
			Accept: 'application/pdf, text/csv, application/octet-stream, */*',
		};
		console.log(`[Exportacion] Solicitando: ${url}`);
		const response = await fetch(url, { headers });
		console.log(`[Exportacion] Estado: ${response.status} ${response.statusText}`);

		const contentType = response.headers.get('content-type') || '';
		console.log(`[Exportacion] Content-Type: ${contentType}`);

		if (!response.ok) {
			let msg = `Error ${response.status}`;
			try {
				if (contentType.includes('application/json')) {
					const errData = await response.json();
					msg = errData.message || errData.error || msg;
				} else {
					const text = await response.text();
					msg = text || msg;
				}
			} catch { /* fallback al mensaje genérico */ }
			throw new Error(msg);
		}

		if (!contentType.includes('application/pdf') && !contentType.includes('text/csv') && !contentType.includes('application/octet-stream')) {
			const text = await response.text();
			console.warn(`[Exportacion] Content-type inesperado: ${contentType}`, text.slice(0, 300));
			throw new Error(`Respuesta inesperada del servidor (${contentType})`);
		}

		const blob = await response.blob();
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(link.href);
	}

	async descargarCSV(sprintId: string, tipo: 'historias' | 'criterios' | 'impedimentos'): Promise<void> {
		const url = `${this.getBaseUrl()}/api/scrum/sprints/${sprintId}/exportar/${tipo}.csv`;
		return this.descargarBlob(url, `${tipo}-sprint-${sprintId}.csv`);
	}

	async descargarPDF(
		sprintId: string,
		opciones?: { trazabilidad?: boolean; retrospectiva?: boolean; impedimentos?: boolean }
	): Promise<void> {
		let url = `${this.getBaseUrl()}/api/scrum/sprints/${sprintId}/exportar/reporte.pdf`;

		if (opciones) {
			const params = new URLSearchParams();
			if (opciones.trazabilidad) params.set('trazabilidad', 'true');
			if (opciones.retrospectiva) params.set('retrospectiva', 'true');
			if (opciones.impedimentos) params.set('impedimentos', 'true');
			const qs = params.toString();
			if (qs) url += `?${qs}`;
		}

		return this.descargarBlob(url, `reporte-sprint-${sprintId}.pdf`);
	}
}

export const exportacionService = new ExportacionService();
