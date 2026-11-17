import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ticket, NuevoTicket } from '../models/ticket';
// CORRECCIÓN: la URL de la API externa estaba escrita a mano ('http://localhost:3000/...') en
// cada servicio. Ahora viene de config/api.ts, igual que en el interceptor y la sesión.
import { API_BASE_URL } from '../config/api';

// AGREGADO: filtros de la consulta paginada (se envían al servidor como parámetros).
export interface FiltrosTickets {
    texto: string;
    estado: string;
    prioridad: string;
    fechaDesde: string;
    fechaHasta: string;
}

// AGREGADO: forma de la respuesta paginada de la API externa.
export interface PaginaTickets {
    count: number;
    next: string | null;
    previous: string | null;
    results: Ticket[];
}

// CORRECCIÓN: este código (con la URL nueva y la consulta paginada) se había pegado por error
// en pages/tickets/tickets.ts, que es el COMPONENTE; así el componente desapareció y este
// servicio seguía apuntando a localhost. Se movió aquí, que es su lugar.
@Injectable({
    providedIn: 'root'
})
export class TicketService {
    private http = inject(HttpClient);
    private apiUrl = `${API_BASE_URL}/tickets`;

    // Read - Get
    // Lista completa; la usan el dashboard y el kanban, que necesitan todos los tickets.
    obtenerTickets(): Observable<Ticket[]> {
        return this.http.get<Ticket[]>(this.apiUrl);
    }

    // AGREGADO: una página de tickets con filtros resueltos en el servidor (lo usa el listado).
    // Solo se envían los filtros con valor; `page` empieza en 1 y `page_size` es el tamaño.
    obtenerTicketsPaginados(
        pagina: number,
        tamanoPagina: number,
        filtros: FiltrosTickets
    ): Observable<PaginaTickets> {
        let params = new HttpParams()
            .set('page', pagina)
            .set('page_size', tamanoPagina);

        for (const [campo, valor] of Object.entries(filtros)) {
            const limpio = valor.trim();

            if (limpio) {
                params = params.set(campo, limpio);
            }
        }

        return this.http.get<PaginaTickets>(`${this.apiUrl}/paginados`, { params });
    }

    obtenerTicket(id: string): Observable<Ticket> {
        return this.http.get<Ticket>(`${this.apiUrl}/${id}`);
    }
    // Create - Post
    crearTicket(ticket: NuevoTicket): Observable<Ticket> {
        return this.http.post<Ticket>(this.apiUrl, ticket);
    }
    // Update - Put
    actualizarTicket(id: string, ticket: Omit<Ticket, 'id'>): Observable<Ticket> {
        return this.http.put<Ticket>(`${this.apiUrl}/${id}`, ticket);
    }
    // Delete - Delete
    eliminarTicket(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
