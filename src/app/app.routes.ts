import { Routes } from '@angular/router';
// CORRECCIÓN: el import apuntaba a './interceptor/guards/acceso-guard', una carpeta que no
// existe; los guards están en src/app/guards. Era un error de compilación.
import { requiereRoles, sesionGuard } from './guards/acceso-guard';
// AGREGADO: lista única de perfiles que pueden crear/editar tickets (la misma que usan el menú
// y los botones).
import { ROLES_GESTION_TICKETS } from './services/sesion';

// Todas las páginas se cargan bajo demanda (loadComponent): el bundle inicial se mantiene
// pequeño y cada pantalla se descarga al visitarla.
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.Login)
  },
  {
    path: 'sin-acceso',
    canActivate: [sesionGuard],
    loadComponent: () => import('./pages/sin-acceso/sin-acceso').then(m => m.SinAcceso)
  },
  {
    path: 'dashboard',
    canActivate: [sesionGuard],
    loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard)
  },
  {
    path: 'tickets',
    canActivate: [sesionGuard],
    loadComponent: () => import('./pages/tickets/tickets').then(m => m.Tickets)
  },
  // CORRECCIÓN: crear y editar tickets exige Soporte o Administrador. La reescritura de las
  // rutas los dejó con sesionGuard (cualquier perfil, incluido Usuario, podía abrir los
  // formularios escribiendo la URL). Con perfil Usuario el guard redirige a /sin-acceso.
  {
    path: 'tickets/nuevo',
    canActivate: [requiereRoles(...ROLES_GESTION_TICKETS)],
    loadComponent: () => import('./pages/ticket-form/ticket-form').then(m => m.TicketForm)
  },
  {
    path: 'tickets/editar/:id',
    canActivate: [requiereRoles(...ROLES_GESTION_TICKETS)],
    loadComponent: () => import('./pages/ticket-form/ticket-form').then(m => m.TicketForm)
  },
  // Esta ruta va DESPUÉS de 'nuevo' y 'editar/:id'; si estuviera antes, "nuevo" se tomaría
  // como un :id.
  {
    path: 'tickets/:id',
    canActivate: [sesionGuard],
    loadComponent: () => import('./pages/ticket-detalle/ticket-detalle').then(m => m.TicketDetalle)
  },
  {
    path: 'kanban',
    canActivate: [requiereRoles('Soporte', 'Administrador')],
    loadComponent: () => import('./pages/kanban/kanban').then(m => m.Kanban)
  },
  {
    path: 'reportes',
    canActivate: [requiereRoles('Administrador')],
    loadComponent: () => import('./pages/reportes/reportes').then(m => m.Reportes)
  },
  // AGREGADO (repuesto): las rutas de Usuarios, que la reescritura había quitado aunque el menú
  // las enlaza. Solo Administrador. 'nuevo' y 'editar/:id' van antes de ':id'.
  {
    path: 'usuarios',
    canActivate: [requiereRoles('Administrador')],
    loadComponent: () => import('./pages/usuarios/usuarios').then(m => m.Usuarios)
  },
  {
    path: 'usuarios/nuevo',
    canActivate: [requiereRoles('Administrador')],
    loadComponent: () => import('./pages/usuario-form/usuario-form').then(m => m.UsuarioForm)
  },
  {
    path: 'usuarios/editar/:id',
    canActivate: [requiereRoles('Administrador')],
    loadComponent: () => import('./pages/usuario-form/usuario-form').then(m => m.UsuarioForm)
  },
  {
    path: 'usuarios/:id',
    canActivate: [requiereRoles('Administrador')],
    loadComponent: () => import('./pages/usuario-detalle/usuario-detalle').then(m => m.UsuarioDetalle)
  },
  // AGREGADO (repuesto): la página "Acerca de", enlazada en el menú.
  {
    path: 'acerca-de',
    canActivate: [sesionGuard],
    loadComponent: () => import('./pages/acerca-de/acerca-de').then(m => m.AcercaDe)
  },
  // CORRECCIÓN: las rutas desconocidas vuelven a mostrar la página 404 (NotFound); redirigirlas
  // en silencio al dashboard ocultaba los enlaces rotos y dejaba ese componente sin uso.
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found').then(m => m.NotFound)
  }
];
