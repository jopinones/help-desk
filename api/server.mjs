// AGREGADO: arranque de json-server con ids correlativos.
//
// Por qué existe: en json-server 1.0.0-beta.15 el POST siempre hace
// `{ ...data, id: randomId() }`, es decir, ignora el `id` que envía Angular. Por eso la
// numeración correlativa no se puede resolver desde el frontend; hay que hacerlo aquí.
//
// Cómo funciona: se envuelve Service.create. Primero json-server crea el registro (con id
// aleatorio) y enseguida se reemplaza por el siguiente número: el mayor id numérico de la
// colección + 1. No hay ningún `await` entre calcular y asignar el id, así que dos
// creaciones simultáneas nunca obtienen el mismo número.
//
// Uso: `npm run api` (reemplaza a `npx json-server db.json`). Acepta las mismas opciones,
// por ejemplo `npm run api -- --port 3100`.
import { Service } from 'json-server/lib/service.js';

// Colecciones con id correlativo. Para que los tickets también lo tengan, agregar 'tickets'.
const COLECCIONES_CORRELATIVAS = ['usuarios'];

const crearOriginal = Service.prototype.create;

Service.prototype.create = async function (name, data = {}) {
  const item = await crearOriginal.call(this, name, data);

  if (!item || !COLECCIONES_CORRELATIVAS.includes(name)) {
    return item;
  }

  // Solo cuentan los ids formados por dígitos; los aleatorios antiguos se ignoran.
  const mayor = this.find(name, { where: {} }).reduce((max, registro) => {
    if (registro === item || !/^\d+$/.test(String(registro.id))) {
      return max;
    }
    return Math.max(max, Number(registro.id));
  }, 0);

  item.id = String(mayor + 1);

  // patchById vuelve a escribir el archivo, ya con el id correlativo, y devuelve el registro.
  return this.patchById(name, item.id, {});
};

// Con el parche aplicado, se inicia json-server normalmente (lee los argumentos de la línea de comandos).
await import('json-server/lib/bin.js');
