import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { type Observable, tap, throwError } from 'rxjs';

import { API_BASE_URL } from '../config/api';
import type { Usuario } from '../models/usuario';

export type Rol = Usuario['rol'];

// AGREGADO (repuesto): lista de roles válidos. Sirve para validar el rol que devuelve la API
// y la sesión guardada. Al reescribir este servicio para la API externa se había perdido.
export const ROLES: readonly Rol[] = ['Administrador', 'Soporte', 'Usuario'];

// AGREGADO (repuesto): perfiles que pueden crear, editar y eliminar tickets. Única definición
// de la regla; la usan rutas, menú y botones. El perfil Usuario solo consulta.
export const ROLES_GESTION_TICKETS: readonly Rol[] = ['Soporte', 'Administrador'];

export interface SesionActual {
  rol: Rol;
  token: string;
  username: string;
}

// Clave bajo la que se guarda la sesión en sessionStorage.
const CLAVE_SESION = 'help-desk.sesion';

@Injectable({ providedIn: 'root' })
export class Sesion {
  private readonly http = inject(HttpClient);
  // CORRECCIÓN: el estado volvía a empezar en null y, al recargar la página (F5), se perdía la
  // sesión y el guard mandaba al login. Parte de la sesión guardada (se repuso la persistencia).
  private readonly estado = signal<SesionActual | null>(this.leer());

  readonly actual = this.estado.asReadonly();

  // CORRECCIÓN: puedeGestionarTickets se había perdido y TicketDetalle, AccionesTicket, Tickets
  // y el menú lo usan (error de compilación). Se repuso.
  readonly puedeGestionarTickets = computed(() => this.tieneAlgunRol(ROLES_GESTION_TICKETS));

  // Obtiene el token y el rol desde la API externa (POST /auth/token).
  iniciarSesion(username: string, password: string): Observable<SesionActual> {
    return this.http
      .post<SesionActual>(`${API_BASE_URL}/auth/token`, { username, password })
      .pipe(
        // CORRECCIÓN: la respuesta se aceptaba sin revisar. Si el servidor devuelve un rol
        // desconocido o no trae token, se rechaza en vez de guardar una sesión rota que dejaría
        // al usuario "dentro" pero sin acceso a nada.
        tap((sesion) => {
          if (!sesion || typeof sesion.token !== 'string' || !ROLES.includes(sesion.rol)) {
            throw new Error('Respuesta de autenticación inválida');
          }
        }),
        tap((sesion) => this.establecer(sesion)),
      );
  }

  // AGREGADO: fija la sesión activa y la guarda. La usa iniciarSesion y las pruebas.
  establecer(sesion: SesionActual): void {
    this.estado.set(sesion);
    this.guardar(sesion);
  }

  cerrar(): void {
    this.estado.set(null);
    this.guardar(null);
  }

  tieneAlgunRol(roles: readonly Rol[]): boolean {
    const sesion = this.actual();
    return sesion !== null && roles.includes(sesion.rol);
  }

  // Lectura segura: sessionStorage puede no existir o fallar (modo privado, datos bloqueados).
  private leer(): SesionActual | null {
    try {
      const texto = sessionStorage.getItem(CLAVE_SESION);
      if (!texto) {
        return null;
      }
      const datos = JSON.parse(texto) as Partial<SesionActual> | null;
      return datos
        && ROLES.includes(datos.rol as Rol)
        && typeof datos.token === 'string'
        && typeof datos.username === 'string'
        ? (datos as SesionActual)
        : null;
    } catch {
      return null;
    }
  }

  private guardar(sesion: SesionActual | null): void {
    try {
      if (sesion) {
        sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
      } else {
        sessionStorage.removeItem(CLAVE_SESION);
      }
    } catch {
      // Sin almacenamiento la sesión dura lo que dure la pestaña cargada.
    }
  }
}
