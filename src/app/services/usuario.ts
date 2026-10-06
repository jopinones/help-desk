import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario } from '../models/usuario';

@Injectable({
    providedIn: 'root'
})
export class UsuarioService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:3000/usuarios';

    obtenerUsuarios(): Observable<Usuario[]> {
        return this.http.get<Usuario[]>(this.apiUrl);
    }
}
