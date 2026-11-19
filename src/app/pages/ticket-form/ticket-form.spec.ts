import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { API_BASE_URL } from '../../config/api';
import { TicketForm } from './ticket-form';

describe('TicketForm', () => {
  let component: TicketForm;
  let fixture: ComponentFixture<TicketForm>;
  let http: HttpTestingController;

  // Crea el componente con o sin :id en la ruta (editar / nuevo).
  async function crear(id: string | null) {
    await TestBed.configureTestingModule({
      imports: [TicketForm],
      // CORRECCIÓN: se usa HttpClient de pruebas (antes provideHttpClient() real, que intentaba
      // llamar a la API); y se simula el parámetro :id de la ruta.
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TicketForm);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  }

  afterEach(() => http.verify());

  const ticketApi = { id: '5', asunto: 'Sin red', descripcion: 'No hay conexión', estado: 'Abierto', prioridad: 'Alta', fechaCreacion: '2026-01-05' };

  it('el formulario vacío es inválido', async () => {
    await crear(null);
    component.ticketForm.patchValue({ asunto: '', descripcion: '' });
    expect(component.ticketForm.invalid).toBe(true);
  });

  it('crea un ticket: valida, recorta los textos y envía POST con la fecha de hoy', async () => {
    await crear(null);
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    component.guardar();
    http.expectNone(`${API_BASE_URL}/tickets`);
    expect(component.ticketForm.touched).toBe(true);

    component.ticketForm.patchValue({ asunto: '  Sin internet  ', descripcion: '  No hay conexión desde ayer  ', prioridad: 'Alta' });
    component.guardar();
    const peticion = http.expectOne(`${API_BASE_URL}/tickets`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toMatchObject({ asunto: 'Sin internet', descripcion: 'No hay conexión desde ayer', estado: 'Abierto', prioridad: 'Alta' });
    expect(peticion.request.body.fechaCreacion).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    peticion.flush({ ...ticketApi });
    expect(navegar).toHaveBeenCalledWith(['/tickets']);
  });

  it('edita un ticket: carga los datos y envía PUT conservando la fecha de creación original', async () => {
    await crear('5');
    http.expectOne(`${API_BASE_URL}/tickets/5`).flush(ticketApi);
    fixture.detectChanges();
    expect(component.ticketForm.getRawValue()).toEqual({ asunto: 'Sin red', descripcion: 'No hay conexión', estado: 'Abierto', prioridad: 'Alta' });
    expect(component.bloqueado()).toBe(false);

    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    component.ticketForm.patchValue({ estado: 'En proceso' });
    component.guardar();
    const peticion = http.expectOne(`${API_BASE_URL}/tickets/5`);
    expect(peticion.request.method).toBe('PUT');
    expect(peticion.request.body.fechaCreacion).toBe('2026-01-05');
    expect(peticion.request.body.estado).toBe('En proceso');
    peticion.flush(ticketApi);
  });

  it('un ticket Cerrado queda bloqueado: formulario deshabilitado, con aviso y sin poder guardar', async () => {
    await crear('5');
    http.expectOne(`${API_BASE_URL}/tickets/5`).flush({ ...ticketApi, estado: 'Cerrado' });
    fixture.detectChanges();
    expect(component.bloqueado()).toBe(true);
    expect(component.ticketForm.disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Los tickets cerrados no se pueden editar');
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBe(true);

    component.guardar();
    http.expectNone(`${API_BASE_URL}/tickets/5`);
  });

  // AGREGADO: confirmación de salida al pulsar Cancelar, tanto al crear como al editar.
  const botonCancelar = () =>
    Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button'))
      .find(b => b.textContent?.trim() === 'Cancelar')!;

  // Simula el diálogo: `respuesta` es lo que el usuario elige (true = descartar).
  function simularDialogo(respuesta: boolean | undefined) {
    return vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue({ afterClosed: () => of(respuesta) } as never);
  }

  it('al crear sin cambios, Cancelar vuelve al listado sin preguntar', async () => {
    await crear(null);
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const dialogo = simularDialogo(true);
    botonCancelar().click();
    expect(dialogo).not.toHaveBeenCalled();
    expect(navegar).toHaveBeenCalledWith(['/tickets']);
  });

  it('al crear con cambios pregunta; "Seguir editando" conserva los valores y "Descartar" vuelve al listado', async () => {
    await crear(null);
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    component.ticketForm.patchValue({ asunto: 'Sin internet', prioridad: 'Alta' });

    const seguir = simularDialogo(false);
    botonCancelar().click();
    expect(seguir).toHaveBeenCalledTimes(1);
    expect(seguir.mock.calls[0][1]?.data).toMatchObject({ mensaje: 'Tienes cambios sin guardar. ¿Deseas descartarlos?' });
    expect(navegar).not.toHaveBeenCalled();
    expect(component.ticketForm.getRawValue()).toMatchObject({ asunto: 'Sin internet', prioridad: 'Alta' });

    // Cerrar el diálogo sin elegir (undefined) también equivale a seguir editando.
    simularDialogo(undefined);
    component.cancelar();
    expect(navegar).not.toHaveBeenCalled();

    simularDialogo(true);
    component.cancelar();
    expect(navegar).toHaveBeenCalledWith(['/tickets']);
  });

  it('al editar, el formulario comienza sin cambios pendientes y Cancelar vuelve directo', async () => {
    await crear('5');
    http.expectOne(`${API_BASE_URL}/tickets/5`).flush(ticketApi);
    fixture.detectChanges();
    expect(component.hayCambios).toBe(false);

    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const dialogo = simularDialogo(true);
    botonCancelar().click();
    expect(dialogo).not.toHaveBeenCalled();
    expect(navegar).toHaveBeenCalledWith(['/tickets']);
  });

  it('al editar con cambios pregunta, y si el usuario deshace el cambio ya no hay nada pendiente', async () => {
    await crear('5');
    http.expectOne(`${API_BASE_URL}/tickets/5`).flush(ticketApi);
    fixture.detectChanges();
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    component.ticketForm.patchValue({ descripcion: 'Otra descripción distinta' });
    expect(component.hayCambios).toBe(true);
    const dialogo = simularDialogo(false);
    component.cancelar();
    expect(dialogo).toHaveBeenCalledTimes(1);
    expect(navegar).not.toHaveBeenCalled();
    expect(component.ticketForm.controls.descripcion.value).toBe('Otra descripción distinta');

    // Volver al valor original: aunque Angular marque el campo como "dirty", no hay cambios reales.
    component.ticketForm.controls.descripcion.setValue('No hay conexión');
    expect(component.hayCambios).toBe(false);
    component.cancelar();
    expect(dialogo).toHaveBeenCalledTimes(1);
    expect(navegar).toHaveBeenCalledWith(['/tickets']);
  });

  it('durante el guardado Cancelar está deshabilitado y no hace nada', async () => {
    await crear(null);
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const dialogo = simularDialogo(true);
    component.ticketForm.patchValue({ asunto: 'Sin internet', descripcion: 'No hay conexión desde ayer' });
    component.guardar();
    fixture.detectChanges();
    expect(component.guardando()).toBe(true);
    expect(botonCancelar().disabled).toBe(true);

    component.cancelar();
    expect(dialogo).not.toHaveBeenCalled();
    expect(navegar).not.toHaveBeenCalled();
    http.expectOne(`${API_BASE_URL}/tickets`).flush(ticketApi);
  });

  it('si el servidor rechaza el guardado, muestra el motivo según el código HTTP', async () => {
    await crear(null);
    component.ticketForm.patchValue({ asunto: 'Sin internet', descripcion: 'No hay conexión desde ayer' });
    component.guardar();
    http.expectOne(`${API_BASE_URL}/tickets`).flush('x', { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();
    expect(component.guardando()).toBe(false);
    expect(fixture.nativeElement.querySelector('.error-guardado').textContent).toContain('Tu perfil no tiene permiso');
  });

  it('si no se puede cargar el ticket a editar, muestra el error', async () => {
    await crear('99');
    http.expectOne(`${API_BASE_URL}/tickets/99`).flush('x', { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect(component.errorCarga()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('No fue posible cargar el ticket');
  });
});
