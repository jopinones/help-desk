import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { UsuarioForm } from './usuario-form';

describe('UsuarioForm', () => {
  let component: UsuarioForm;
  let fixture: ComponentFixture<UsuarioForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsuarioForm],
      // CORRECCIÓN: faltaban el router y HttpClient; se usa la versión de pruebas para no llamar a la API real.
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(UsuarioForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
