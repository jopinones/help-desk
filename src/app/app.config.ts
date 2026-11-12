import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
// AGREGADO: interceptor que adjunta el token de la sesión a las peticiones a la API.
import { tokenInterceptor } from './interceptor/token-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // CORRECCIÓN: sin withInterceptors([...]) el interceptor nunca se ejecuta aunque exista.
    provideHttpClient(withInterceptors([tokenInterceptor]))
  ]
};
