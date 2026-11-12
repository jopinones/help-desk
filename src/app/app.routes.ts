import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { Tickets } from './pages/tickets/tickets';
import { TicketForm } from './pages/ticket-form/ticket-form';
import { TicketDetalle } from './pages/ticket-detalle/ticket-detalle';
// CAMBIO: Kanban vuelve a cargarse bajo demanda (loadComponent) al final de este archivo; al
// importarlo aquí, el datepicker y el drag & drop engordaban el bundle inicial por encima del
// límite de error de 1 MB y el build de producción fallaba.
import { Reportes } from './pages/reportes/reportes';
// AGREGADO: se repusieron las rutas de Usuarios, Acerca de y la página 404, que la reescritura
// de las rutas había quitado (el menú ya no podía llegar a ellas).
import { Usuarios } from './pages/usuarios/usuarios';
import { UsuarioForm } from './pages/usuario-form/usuario-form';
import { UsuarioDetalle } from './pages/usuario-detalle/usuario-detalle';
import { AcercaDe } from './pages/acerca-de/acerca-de';
import { NotFound } from './pages/not-found/not-found';

import { Login } from './pages/login/login';
import { requiereRoles, sesionGuard } from './guards/acceso-guard';
import { SinAcceso } from './pages/sin-acceso/sin-acceso';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: Login
  },
  {
    path: 'sin-acceso',
    canActivate: [sesionGuard],
    component: SinAcceso
  },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [sesionGuard]
  },
  {
    path: 'tickets',
    component: Tickets,
    canActivate: [sesionGuard]
  },
  {
    path: 'tickets/nuevo',
    component: TicketForm,
    canActivate: [sesionGuard]
  },
  {
    path: 'tickets/editar/:id',
    component: TicketForm,
    canActivate: [sesionGuard]
  },
  {
    path: 'tickets/:id',
    component: TicketDetalle,
    canActivate: [sesionGuard]
  },
  {
    path: 'kanban',
    loadComponent: () => import('./pages/kanban/kanban').then((m) => m.Kanban),
    canActivate: [requiereRoles('Soporte', 'Administrador')]
  },
  {
    path: 'reportes',
    component: Reportes,
    canActivate: [requiereRoles('Administrador')]
  },
  // AGREGADO: gestión de usuarios solo para Administrador (como el enlace del menú).
  // 'nuevo' y 'editar/:id' van antes de ':id', si no 'nuevo' se tomaría como un id.
  {
    path: 'usuarios',
    component: Usuarios,
    canActivate: [requiereRoles('Administrador')]
  },
  {
    path: 'usuarios/nuevo',
    component: UsuarioForm,
    canActivate: [requiereRoles('Administrador')]
  },
  {
    path: 'usuarios/editar/:id',
    component: UsuarioForm,
    canActivate: [requiereRoles('Administrador')]
  },
  {
    path: 'usuarios/:id',
    component: UsuarioDetalle,
    canActivate: [requiereRoles('Administrador')]
  },
  {
    path: 'acerca-de',
    component: AcercaDe,
    canActivate: [sesionGuard]
  },
  // CAMBIO: las rutas desconocidas vuelven a mostrar la página 404 (NotFound); la reescritura
  // las redirigía en silencio al dashboard y ese componente quedaba sin uso.
  {
    path: '**',
    component: NotFound
  }
];
