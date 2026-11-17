import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NuevoUsuario, Usuario } from '../models/usuario';
// CORRECCIÓN: URL de la API externa desde config/api.ts (antes 'http://localhost:3000/usuarios').
import { API_BASE_URL } from '../config/api';

// CORRECCIÓN: el código con la URL nueva se había pegado por error en pages/usuarios/usuarios.ts
// (el COMPONENTE), y esa versión solo traía obtenerUsuarios(); se perdían obtenerUsuario,
// crear, actualizar y eliminar, que usan los formularios y el listado. Se repuso todo aquí.
@Injectable({
    providedIn: 'root'
})
export class UsuarioService {
    private http = inject(HttpClient);
    private apiUrl = `${API_BASE_URL}/usuarios`;

    // Read - Get
    obtenerUsuarios(): Observable<Usuario[]> {
        return this.http.get<Usuario[]>(this.apiUrl);
    }

    obtenerUsuario(id: string): Observable<Usuario> {
        return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
    }

    // Create - Post. El id lo asigna el servidor.
    // CAMBIO: ya no depende de api/server.mjs (el parche de ids correlativos de json-server);
    // con la API externa el id lo decide el backend.
    crearUsuario(usuario: NuevoUsuario): Observable<Usuario> {
        return this.http.post<Usuario>(this.apiUrl, usuario);
    }

    // Update - Put
    actualizarUsuario(id: string, usuario: NuevoUsuario): Observable<Usuario> {
        return this.http.put<Usuario>(`${this.apiUrl}/${id}`, usuario);
    }

    // "Eliminar" usuario es un borrado lógico: PATCH que solo cambia el estado a 'Eliminado'.
    eliminarUsuario(id: string): Observable<Usuario> {
        return this.http.patch<Usuario>(`${this.apiUrl}/${id}`, { estado: 'Eliminado' });
    }
}
