/** Minúsculas e sem acento: mesma regra da coluna `busca` no banco. */
export const normalizar = (texto = '') =>
  texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

export function debounce(fn, esperaMs) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), esperaMs);
  };
}
