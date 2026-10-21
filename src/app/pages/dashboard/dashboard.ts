import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  imports: [RouterLink, MatIconModule],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  accesos = [
    { ruta: '/tickets', icono: 'confirmation_number', titulo: 'Tickets', descripcion: 'Consulta y gestiona las solicitudes de soporte.' },
    { ruta: '/tickets/nuevo', icono: 'add_circle', titulo: 'Crear ticket', descripcion: 'Registra una nueva solicitud.' },
    { ruta: '/kanban', icono: 'view_kanban', titulo: 'Kanban', descripcion: 'Visualiza el avance en un tablero.' },
    { ruta: '/reportes', icono: 'bar_chart', titulo: 'Reportes', descripcion: 'Revisa indicadores y resultados.' },
  ];
}
