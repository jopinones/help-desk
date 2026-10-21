import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ticket, NuevoTicket } from '../models/ticket';

@Injectable({
    providedIn: 'root'
})
export class TicketService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:3000/tickets';

    // Read - Get
    obtenerTickets(): Observable<Ticket[]> {
        return this.http.get<Ticket[]>(this.apiUrl);
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
    eliminarTicket(id:string):Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`)
    }
}
