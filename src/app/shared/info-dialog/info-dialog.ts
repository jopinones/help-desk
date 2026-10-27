import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { InfoDialogData } from './info-dialog-data';

// AGREGADO: diálogo informativo compartido. Muestra un título y un mensaje con un único
// botón "Cerrar". Se abre con MatDialog.open(InfoDialog, { data: { titulo, mensaje } }).
@Component({
  // MatDialogModule aporta mat-dialog-title, mat-dialog-content, mat-dialog-actions y mat-dialog-close.
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  selector: 'app-info-dialog',
  styleUrl: './info-dialog.scss',
  templateUrl: './info-dialog.html',
})
export class InfoDialog {
  // Textos que envía quien abre el diálogo.
  data = inject<InfoDialogData>(MAT_DIALOG_DATA);

  // No hace falta inyectar MatDialogRef ni escribir un método cerrar(): el botón usa la
  // directiva mat-dialog-close, que cierra el diálogo por sí sola.
}
