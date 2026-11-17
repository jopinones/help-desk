// URL base de la API externa (Django, expuesta por un túnel de desarrollo). Los servicios, la
// sesión y el interceptor la toman de aquí: si el túnel cambia, solo se edita esta línea.
// CORRECCIÓN: el comentario original ("// Agrega ") estaba incompleto.
// Sin barra final: las URLs se arman como `${API_BASE_URL}/tickets`.
export const API_BASE_URL = 'https://z1ppqjv1-3000.brs.devtunnels.ms';
