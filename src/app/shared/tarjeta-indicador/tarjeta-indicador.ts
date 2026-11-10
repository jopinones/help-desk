import { Component, input } from '@angular/core';
// AGREGADO: la plantilla aplica la variante como clase con [ngClass].
import { NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

// CAMBIO: se exporta el tipo para que quien use la tarjeta (dashboard) pueda tiparlo.
export type VarianteIndicador =
    | 'neutra'
    | 'principal'
    | 'azul'
    | 'ambar'
    | 'verde'
    | 'roja';

@Component({
  imports: [MatIconModule, NgClass],
  selector: 'app-tarjeta-indicador',
  styleUrl: './tarjeta-indicador.scss',
  templateUrl: './tarjeta-indicador.html',
})
export class TarjetaIndicador {
    readonly titulo = input.required<string>();
    readonly valor = input.required<number | string>();

    readonly descripcion = input('');
    readonly apoyo = input('');
    readonly unidad = input('');

    readonly icono = input('analytics');
    readonly variante = input<VarianteIndicador>('neutra');
}
