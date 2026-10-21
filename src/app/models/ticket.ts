export interface Ticket {
    id: string;
    asunto: string;
    descripcion: string;
    estado: 'Abierto' | 'En proceso' | 'Cerrado';
    prioridad: 'Baja' | 'Media' | 'Alta';
    fechaCreacion: string;
}

export type NuevoTicket = Omit<Ticket, 'id'>;

export const MOTIVO_NO_EDITABLE = 'Los tickets cerrados no se pueden editar';

// Regla única: un ticket cerrado no se edita.
export function puedeEditar(ticket: Pick<Ticket, 'estado'>): boolean {
    return ticket.estado !== 'Cerrado';
}