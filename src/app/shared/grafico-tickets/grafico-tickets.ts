import { Component, computed, input, signal } from '@angular/core';
// CORRECCIÓN: se quitó `import { readonly } from '@angular/forms/signals'`; no se usaba (se
// había importado por error al escribir `readonly` en los campos) y arrastraba código de formularios.

export interface SerieTickets {
  etiqueta: string;
  cantidad: number;
  color: string;
  // AGREGADO: texto breve para el eje X del gráfico de líneas (ej. "01-10"); si falta se
  // usa la etiqueta completa.
  etiquetaCorta?: string;
}

// AGREGADO: punto ya posicionado dentro del lienzo SVG del gráfico de líneas.
interface PuntoLinea extends SerieTickets {
  x: number;
  y: number;
  // Para no saturar el gráfico, el número y el texto del eje solo se dibujan en algunos puntos.
  mostrarCantidad: boolean;
  mostrarEje: boolean;
}

@Component({
  imports: [],
  selector: 'app-grafico-tickets',
  // CORRECCIÓN: apuntaba a './grafico-tickets.css' pero el archivo es .scss; el build fallaba.
  styleUrl: './grafico-tickets.scss',
  templateUrl: './grafico-tickets.html',
})
export class GraficoTickets {
  readonly titulo = input.required<string>();
  // AGREGADO: 'line' (gráfico de líneas). En él cada serie es un punto, en el orden recibido.
  readonly tipo = input.required<'bar' | 'doughnut' | 'line'>();
  readonly series = input.required<readonly SerieTickets[]>();

  // Etiqueta de la serie resaltada (por puntero o foco); null = ninguna.
  readonly activa = signal<string | null>(null);
  readonly maximo = computed(() =>
    Math.max(1, ...this.series().map(serie => serie.cantidad))
  );
  readonly total = computed(() => this.series().reduce((suma, serie) => suma + serie.cantidad, 0));
  readonly segmentos = computed(() => {
    const total = this.total();
    let inicio = 0;

    return this.series().map(serie => {
      const longitud = total > 0 ? (serie.cantidad / total) * 100 : 0;
      const segmento = { ...serie, inicio, longitud };

      inicio += longitud;
      return segmento;
    });
  });

  // AGREGADO: color de la línea = el de la primera serie (todos los puntos comparten línea).
  readonly colorLinea = computed(() => this.series()[0]?.color ?? '#2563eb');

  // AGREGADO: posiciona cada punto en el lienzo (viewBox 240x180). El área de trazado va de
  // x=24 a x=224 y de y=156 (cantidad 0) hasta y=40 (el máximo), igual que las barras.
  readonly puntos = computed<PuntoLinea[]>(() => {
    const series = this.series();
    const n = series.length;
    const maximo = this.maximo();
    // Con muchos puntos solo se rotulan algunos del eje X (aprox. 6) para que no se encimen.
    const paso = Math.max(1, Math.ceil(n / 6));

    return series.map((serie, indice) => ({
      ...serie,
      // Un solo punto se centra; con varios se reparten en partes iguales.
      x: n === 1 ? 124 : 24 + (indice * 200) / (n - 1),
      y: 156 - (serie.cantidad / maximo) * 116,
      mostrarCantidad: n <= 10,
      mostrarEje: indice % paso === 0,
    }));
  });

  // Valor del atributo `points` de la <polyline>: "x1,y1 x2,y2 ...".
  readonly trazado = computed(() => this.puntos().map(p => `${p.x},${p.y}`).join(' '));

  readonly detalle = computed(() => this.series().find(serie => serie.etiqueta === this.activa()));

  porcentaje(cantidad: number): string {
    const total = this.total();

    return new Intl.NumberFormat('es-CL', {
      style: 'percent',
      maximumFractionDigits: 1
    }).format(total > 0 ? cantidad / total : 0);
  }
}
