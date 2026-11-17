import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../config/api';
import { UsuarioService } from './usuario';

describe('UsuarioService', () => {
  let service: UsuarioService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UsuarioService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // AGREGADO: URL de la API externa y conservación de todas las operaciones del CRUD.
  it('usa la URL de la API externa y conserva consultar, crear, actualizar y eliminar', () => {
    const datos = { nombre: 'A', email: 'a@a.cl', rol: 'Usuario', estado: 'Vigente', fechaCreacion: '2026-01-01' } as const;
    service.obtenerUsuarios().subscribe();
    service.obtenerUsuario('4').subscribe();
    service.crearUsuario(datos).subscribe();
    service.actualizarUsuario('4', datos).subscribe();
    service.eliminarUsuario('4').subscribe();
    const llamadas = http.match(() => true).map((r) => `${r.request.method} ${r.request.url}`);
    expect(llamadas).toEqual([
      `GET ${API_BASE_URL}/usuarios`,
      `GET ${API_BASE_URL}/usuarios/4`,
      `POST ${API_BASE_URL}/usuarios`,
      `PUT ${API_BASE_URL}/usuarios/4`,
      `PATCH ${API_BASE_URL}/usuarios/4`,
    ]);
  });
});
