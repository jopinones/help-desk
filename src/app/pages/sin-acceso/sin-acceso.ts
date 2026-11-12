import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  selector: 'app-sin-acceso',
  // CORRECCIÓN: apuntaba a './sin-acceso.css' pero el archivo es .scss; el build fallaba (NG2008).
  styleUrl: './sin-acceso.scss',
  templateUrl: './sin-acceso.html',
})
export class SinAcceso {}
