import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';

import { Sesion } from './services/sesion';

@Component({
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatListModule
  ],
  selector: 'app-root',
  // CORRECCIÓN: apuntaba a './app.css' pero el archivo es .scss; el build fallaba (NG2008).
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('help-desk');

  protected readonly sesion = inject(Sesion);
  private readonly router = inject(Router);

  // AGREGADO: se repuso el estado del submenú Tickets (Listado / Crear ticket); al reescribir
  // el menú se había perdido y la plantilla ya no lo usaba.
  ticketsAbierto = signal(false);

  alternarTickets(): void {
    this.ticketsAbierto.update((abierto) => !abierto);
  }

  cerrarSesion(): void {
    this.sesion.cerrar();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
