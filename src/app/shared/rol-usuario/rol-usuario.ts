import { Component, input } from '@angular/core';
import { Usuario } from '../../models/usuario';

// AGREGADO: componente compartido que muestra el rol de un usuario como una etiqueta de color.
// Sigue el mismo patrón que estado-ticket y prioridad-ticket.
@Component({
  imports: [],
  selector: 'app-rol-usuario',
  styleUrl: './rol-usuario.scss',
  templateUrl: './rol-usuario.html',
})
export class RolUsuario {
  // Rol a mostrar (obligatorio). Su tipo sale del modelo, así que si cambian los roles
  // el compilador avisa aquí.
  rol = input.required<Usuario['rol']>();
}
