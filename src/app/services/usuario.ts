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
    crearUsuario(usuario: NuevoUsuario): Observable<Usuario> {
        return this.http.post<Usuario>(this.apiUrl, usuario);
    }

    // Update - Put (agregado: lo necesita usuario-form en modo edición)
    actualizarUsuario(id: string, usuario: NuevoUsuario): Observable<Usuario> {
        return this.http.put<Usuario>(`${this.apiUrl}/${id}`, usuario);
    }
}
