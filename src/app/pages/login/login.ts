import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ROLES, Sesion, type Rol } from '../../services/sesion';

@Component({
  imports: [],
  selector: 'app-login',
  // CORRECCIÓN: apuntaba a './login.css' pero el archivo es .scss; el build fallaba (NG2008).
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login {
  private readonly sesion = inject(Sesion);
  private readonly router = inject(Router);

  // CORRECCIÓN: era `private`, pero la plantilla lo recorre con @for; una plantilla solo puede
  // usar miembros públicos o protected. Además ahora reutiliza la lista ROLES del servicio.
  protected readonly roles: readonly Rol[] = ROLES;

  entrar(rol: Rol): void {
    // CORRECCIÓN: el servicio tenía otro nombre (iniciaDemostracion); ya coinciden.
    this.sesion.iniciarDemostracion(rol);
    void this.router.navigateByUrl('/dashboard', { replaceUrl: true });
  }
}
