import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NuevoUsuario, Usuario } from '../models/usuario';

@Injectable({
    providedIn: 'root'
})
export class UsuarioService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:3000/usuarios';

    // Read - Get
    obtenerUsuarios(): Observable<Usuario[]> {
        return this.http.get<Usuario[]>(this.apiUrl);
    }

    // CORRECCIÓN: obtenerUsuarios() no recibe parámetros; usuario-form llamaba
    // obtenerUsuarios(id) esperando un solo usuario. Se agrega este método.
    obtenerUsuario(id: string): Observable<Usuario> {
        return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
    }

    // Create - Post (agregado: lo necesita usuario-form para guardar)
    // CORRECCIÓN: el id correlativo ya no se calcula aquí. El intento anterior (leer los
    // usuarios y enviar `id = mayor + 1`) no funcionaba: json-server 1.0.0-beta.15 ignora
    // el `id` del POST y siempre pone uno aleatorio. Ahora el correlativo lo asigna el
    // servidor (ver api/server.mjs, que se inicia con `npm run api`); el cliente solo envía
    // los datos y recibe el usuario creado con su id.
    crearUsuario(usuario: NuevoUsuario): Observable<Usuario> {
        return this.http.post<Usuario>(this.apiUrl, usuario);
    }

    // Update - Put (agregado: lo necesita usuario-form en modo edición)
    actualizarUsuario(id: string, usuario: NuevoUsuario): Observable<Usuario> {
        return this.http.put<Usuario>(`${this.apiUrl}/${id}`, usuario);
    }

    // AGREGADO: "eliminar" usuario es un borrado lógico, no un DELETE: solo cambia el
    // estado a 'Eliminado' con PATCH (modifica un campo sin reenviar el resto del registro).
    eliminarUsuario(id: string): Observable<Usuario> {
        return this.http.patch<Usuario>(`${this.apiUrl}/${id}`, { estado: 'Eliminado' });
    }
}
