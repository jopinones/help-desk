import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { InfoDialog } from './info-dialog';

describe('InfoDialog', () => {
  let component: InfoDialog;
  let fixture: ComponentFixture<InfoDialog>;
  // AGREGADO: doble de prueba del MatDialogRef; mat-dialog-close lo usa para cerrar.
  const dialogRef = { close: vi.fn() };

  beforeEach(async () => {
    dialogRef.close.mockClear();

    await TestBed.configureTestingModule({
      imports: [InfoDialog],
      // CORRECCIÓN: el componente inyecta MAT_DIALOG_DATA y la directiva mat-dialog-close
      // necesita MatDialogRef; ambos solo existen cuando lo abre MatDialog, así que en la
      // prueba hay que proveerlos a mano.
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { titulo: 'Aviso', mensaje: 'Operación realizada.' } },
        { provide: MatDialogRef, useValue: dialogRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InfoDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // AGREGADO: muestra el título y el mensaje recibidos.
  it('muestra el título y el mensaje', () => {
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(texto).toContain('Aviso');
    expect(texto).toContain('Operación realizada.');
  });

  // AGREGADO: tiene un único botón, "Cerrar", y al pulsarlo se cierra el diálogo.
  it('tiene solo el botón Cerrar y cierra al pulsarlo', () => {
    const botones = (fixture.nativeElement as HTMLElement).querySelectorAll('button');

    expect(botones.length).toBe(1);
    expect(botones[0].textContent?.trim()).toBe('Cerrar');

    botones[0].click();
    expect(dialogRef.close).toHaveBeenCalled();
  });
});
