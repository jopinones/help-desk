import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Sesion, type Rol } from '../services/sesion';

// Exige una sesión iniciada; si no la hay, redirige al login.
// CAMBIO: se quitaron los parámetros (route, state), que no se usaban.
export const sesionGuard: CanActivateFn = () => {
  const sesion = inject(Sesion);
  const router = inject(Router);

  return sesion.actual() !== null ? true : router.createUrlTree(['/login']);
};

// Exige sesión y, además, que el rol sea uno de los indicados.
export function requiereRoles(...roles: Rol[]): CanActivateFn {
  return () => {
    const sesion = inject(Sesion);
    const router = inject(Router);

    if (sesion.actual() === null) {
      return router.createUrlTree(['/login']);
    }

    if (sesion.tieneAlgunRol(roles)) {
      return true;
    }

    // CORRECCIÓN: la ruta era relativa (['sin-acceso']); se escribe absoluta para no depender
    // de desde qué ruta se evalúe el guard.
    return router.createUrlTree(['/sin-acceso']);
  };
}
