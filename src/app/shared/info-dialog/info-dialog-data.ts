// AGREGADO: datos que recibe el diálogo informativo, igual que ConfirmDialogData pero sin
// textos de botones, porque InfoDialog solo tiene el botón "Cerrar".
export interface InfoDialogData {
    titulo: string;
    mensaje: string;
}
