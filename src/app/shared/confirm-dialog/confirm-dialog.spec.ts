import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConfirmDialog } from './confirm-dialog';

describe('ConfirmDialog', () => {
  let component: ConfirmDialog;
  let fixture: ComponentFixture<ConfirmDialog>;
  // AGREGADO: doble de prueba del MatDialogRef para comprobar con qué valor se cierra.
  const dialogRef = { close: vi.fn() };

  beforeEach(async () => {
    dialogRef.close.mockClear();

    await TestBed.configureTestingModule({
      imports: [ConfirmDialog],
      // CORRECCIÓN: el componente inyecta MAT_DIALOG_DATA y MatDialogRef, que solo existen
      // cuando lo abre MatDialog; en la prueba hay que proveerlos a mano.
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { titulo: 'Eliminar', mensaje: '¿Seguro?' } },
        { provide: MatDialogRef, useValue: dialogRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // AGREGADO: muestra el título y el mensaje recibidos, y los textos por defecto de los botones.
  it('muestra los textos recibidos', () => {
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(texto).toContain('Eliminar');
    expect(texto).toContain('¿Seguro?');
    expect(texto).toContain('Cancelar');
    expect(texto).toContain('Confirmar');
  });

  // AGREGADO: Confirmar cierra con true y Cancelar con false.
  it('cierra con true al confirmar y con false al cancelar', () => {
    component.confirmar();
    expect(dialogRef.close).toHaveBeenCalledWith(true);

    component.cancelar();
    expect(dialogRef.close).toHaveBeenCalledWith(false);
  });
});
