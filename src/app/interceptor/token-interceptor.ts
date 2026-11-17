import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';

import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { API_BASE_URL } from '../config/api';
import { Sesion } from '../services/sesion';

export const tokenInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const sesion = inject(Sesion);
  const token = sesion.actual()?.token;

  if (!token) {
    return siguiente(peticion);
  }

  const documento = inject(DOCUMENT);
  const url = new URL(peticion.url, documento.baseURI);
  const api = new URL(API_BASE_URL);

  // MODIFICADO: limita el Bearer a tickets y usuarios del túnel.
  const esRecursoProtegido =
    url.origin === api.origin &&
    /^\/(?:tickets|usuarios|usuario)(?:\/|$)/.test(url.pathname);

  if (!esRecursoProtegido) {
    return siguiente(peticion);
  }

  const router = inject(Router);

  return siguiente(
    peticion.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  ).pipe(
    // AGREGADO (repuesto): con la API externa el token puede vencer. Si un recurso protegido
    // responde 401, se cierra la sesión y se envía al login; el error se relanza para que
    // cada pantalla siga mostrando su mensaje. Solo aplica a recursos protegidos (no a
    // /auth/token, donde un 401 significa "credenciales incorrectas" y lo muestra el login).
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        sesion.cerrar();
        void router.navigateByUrl('/login', { replaceUrl: true });
      }
      return throwError(() => error);
    }),
  );
};
