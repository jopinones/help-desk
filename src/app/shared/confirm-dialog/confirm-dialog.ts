import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmDialogData } from './confirm-dialog-data';

@Component({
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  selector: 'app-confirm-dialog',
  // CORRECCIÓN: apuntaba a './confirm-dialog.css', pero el archivo es .scss; el build fallaba al usarlo.
  styleUrl: './confirm-dialog.scss',
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialog {
  // Textos que envía quien abre el diálogo (título, mensaje y, opcionalmente, los botones).
  data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  // CAMBIO: se escribió el tipo con el genérico explícito en inject<...>(); antes se usaba
  // `MatDialogRef<ConfirmDialog, boolean>` como valor, que es válido pero menos claro.
  // El diálogo se cierra con `true` (confirmó) o `false` (canceló).
  private dialogRef = inject<MatDialogRef<ConfirmDialog, boolean>>(MatDialogRef);

  cancelar(): void {
    this.dialogRef.close(false);
  }

  confirmar(): void {
    this.dialogRef.close(true);
  }
}
