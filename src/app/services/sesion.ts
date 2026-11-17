// CORRECCIÓN: se quitó `Service` del import; no se usa (el decorador es @Injectable) y no es
// parte de la API que necesita este archivo.
import { Injectable, computed, signal } from '@angular/core';
import type { Usuario } from '../models/usuario';

export type Rol = Usuario['rol'];

// AGREGADO: lista de roles válidos. La usa el login (para dibujar los botones) y la lectura de
// la sesión guardada (para descartar datos manipulados o de otra versión).
export const ROLES: readonly Rol[] = ['Administrador', 'Soporte', 'Usuario'];

// AGREGADO: perfiles que pueden crear y editar tickets. Es la única definición de la regla: la
// usan las rutas (guard), el menú y los botones Nuevo ticket / Editar. El perfil Usuario solo
// consulta (listado y detalle).
export const ROLES_GESTION_TICKETS: readonly Rol[] = ['Soporte', 'Administrador'];

interface SesionActual {
    rol: Rol;
    token: string;
}

// AGREGADO: clave bajo la que se guarda la sesión en sessionStorage.
const CLAVE_SESION = 'help-desk.sesion';

// NOTA: es una sesión de DEMOSTRACIÓN en el navegador; no autentica contra el servidor, así que
// no protege datos reales (cualquiera puede escribir su propio rol en sessionStorage). Los
// guards solo ordenan la navegación; la seguridad real debe hacerla la API.
@Injectable({ providedIn: 'root'})
export class Sesion {
    // CAMBIO: el estado parte de la sesión guardada. Antes siempre empezaba en null, y al
    // recargar la página (F5) se perdía la sesión y el guard mandaba de nuevo al login.
    private readonly estado = signal<SesionActual | null>(this.leer());
    readonly actual = this.estado.asReadonly();

    // AGREGADO: true si el perfil activo puede crear/editar tickets. Es un computed: las vistas
    // se actualizan solas al iniciar o cerrar sesión.
    readonly puedeGestionarTickets = computed(() => this.tieneAlgunRol(ROLES_GESTION_TICKETS));

    // CORRECCIÓN: se llamaba `iniciaDemostracion` y el login invoca `iniciarDemostracion`
    // (error de compilación TS2551); se unificó el nombre en infinitivo.
    iniciarDemostracion(rol: Rol): void {
        const sesion: SesionActual = {
            rol,
            token: `demo-${rol.toLowerCase()}`
        };
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

    // AGREGADO: lectura segura. sessionStorage puede no existir o fallar (modo privado,
    // datos bloqueados), por eso todo va en try/catch y la app funciona igual sin él.
    private leer(): SesionActual | null {
        try {
            const texto = sessionStorage.getItem(CLAVE_SESION);
            if (!texto) {
                return null;
            }
            const datos = JSON.parse(texto) as Partial<SesionActual> | null;
            return datos && ROLES.includes(datos.rol as Rol) && typeof datos.token === 'string'
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
