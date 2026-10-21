export interface Usuario {
    // CORRECCIÓN: json-server entrega los ids como string (ver db.json), no como number.
    id: string;
    nombre: string;
    email: string;
    rol: 'Administrador' | 'Soporte' | 'Usuario';
    // Estado del usuario. 'Eliminado' es un borrado lógico: el registro se conserva en la API.
    estado: 'Vigente' | 'Bloqueado' | 'Eliminado';
    // CORRECCIÓN: ya no es opcional; se actualizó db.json para que todos los usuarios la tengan.
    fechaCreacion: string;
}

// CORRECCIÓN: tipo para crear usuarios; el id lo asigna la API (igual que NuevoTicket).
export type NuevoUsuario = Omit<Usuario, 'id'>;

export const MOTIVO_NO_EDITABLE = 'Los usuarios bloqueados no se pueden editar';

// AGREGADO: motivo para los usuarios eliminados (borrado lógico).
export const MOTIVO_ELIMINADO = 'Los usuarios eliminados no se pueden editar';

// AGREGADO: reglas únicas de negocio; el listado, el detalle y el formulario usan estas mismas.
// Solo un usuario Vigente se puede editar (ni Bloqueado ni Eliminado).
export function puedeEditar(usuario: Pick<Usuario, 'estado'>): boolean {
    return usuario.estado === 'Vigente';
}

// Un usuario ya eliminado no se vuelve a eliminar.
export function puedeEliminar(usuario: Pick<Usuario, 'estado'>): boolean {
    return usuario.estado !== 'Eliminado';
}

// Texto del tooltip cuando "Editar" está deshabilitado.
export function motivoNoEditable(usuario: Pick<Usuario, 'estado'>): string {
    return usuario.estado === 'Eliminado' ? MOTIVO_ELIMINADO : MOTIVO_NO_EDITABLE;
}