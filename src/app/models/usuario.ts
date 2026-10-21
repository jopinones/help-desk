export interface Usuario {
    // CORRECCIÓN: json-server entrega los ids como string (ver db.json), no como number.
    id: string;
    nombre: string;
    email: string;
    rol: 'Administrador' | 'Soporte' | 'Usuario';
    // CORRECCIÓN: opcional, porque los usuarios que ya existen en db.json no tienen este campo.
    fechaCreacion?: string;
}

// CORRECCIÓN: tipo para crear usuarios; el id lo asigna la API (igual que NuevoTicket).
export type NuevoUsuario = Omit<Usuario, 'id'>;
