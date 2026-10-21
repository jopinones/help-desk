import { Routes } from '@angular/router';

import { Dashboard } from './pages/dashboard/dashboard';
import { Tickets } from './pages/tickets/tickets';
import { Kanban } from './pages/kanban/kanban';
import { Reportes } from './pages/reportes/reportes';
import { Usuarios } from './pages/usuarios/usuarios';
// AGREGADO: formulario (crear/editar) y detalle de usuario.
import { UsuarioForm } from './pages/usuario-form/usuario-form';
import { UsuarioDetalle } from './pages/usuario-detalle/usuario-detalle';
import { AcercaDe } from './pages/acerca-de/acerca-de';
import { NotFound } from './pages/not-found/not-found';
import { TicketForm } from './pages/ticket-form/ticket-form';
import { TicketDetalle } from './pages/ticket-detalle/ticket-detalle';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
    },
    {
        path: 'dashboard',
        component: Dashboard
    },
    {
        path: 'tickets',
        component: Tickets
    },
    {
        path: 'tickets/nuevo',
        component: TicketForm
    },
    {
        path: 'tickets/editar/:id',
        component: TicketForm
    },
    {
        path: 'tickets/:id',
        component: TicketDetalle

    },
    {
        path: 'kanban',
        component: Kanban
    },
    {
        path: 'reportes',
        component: Reportes
    },
    {
        path: 'usuarios',
        component: Usuarios
    },
    // AGREGADO: 'nuevo' y 'editar/:id' van antes de ':id', si no 'nuevo' se tomaría como un id.
    {
        path: 'usuarios/nuevo',
        component: UsuarioForm
    },
    {
        path: 'usuarios/editar/:id',
        component: UsuarioForm
    },
    {
        path: 'usuarios/:id',
        component: UsuarioDetalle
    },
    {
        path: 'acerca-de',
        component: AcercaDe
    },
    {
        path: '**',
        component: NotFound
    }
];
