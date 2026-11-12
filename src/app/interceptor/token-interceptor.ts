import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { Sesion } from '../services/sesion';

// AGREGADO: el interceptor solo era un esqueleto (`return next(req)`) y además no estaba
// registrado en app.config.ts, así que nunca se ejecutaba. Ahora:
//  1) agrega "Authorization: Bearer <token>" a las peticiones a NUESTRA API, y
//  2) si la API responde 401, cierra la sesión y envía al login.

// Solo se adjunta el token a este origen: enviarlo a cualquier otra URL filtraría la credencial.
const API_URL = 'http://localhost:3000/';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const sesion = inject(Sesion);
  const router = inject(Router);

  const token = sesion.actual()?.token;

  // Las peticiones son inmutables: para cambiarlas hay que clonar. Sin sesión, o hacia otro
  // origen, pasan sin modificar.
  const peticion = token && req.url.startsWith(API_URL)
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(peticion).pipe(
    catchError((error: unknown) => {
      // Un 401 de nuestra API significa sesión inválida o vencida. Se relanza el error para
      // que cada componente siga mostrando su mensaje.
      if (error instanceof HttpErrorResponse && error.status === 401 && req.url.startsWith(API_URL)) {
        sesion.cerrar();
        void router.navigateByUrl('/login', { replaceUrl: true });
      }
      return throwError(() => error);
    })
  );
};
