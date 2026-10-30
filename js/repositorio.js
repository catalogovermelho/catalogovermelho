import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { distanciaKm } from './geo.js';
import { normalizar } from './texto.js';
import { EMPRESAS_DEMO } from './demo.js';

export const TAMANHO_PAGINA = 24;
export const modoDemo = !(SUPABASE_URL && SUPABASE_ANON_KEY);

export class ErroCadastro extends Error {}

/**
 * @param {{ q?: string, uf?: string, cidade?: string, categoria?: string,
 *           origem?: {lat:number,lng:number}, pagina?: number }} filtros
 * @param {AbortSignal} [signal]
 */
export function buscarEmpresas(filtros, signal) {
  return modoDemo ? buscarLocal(filtros) : buscarRemoto(filtros, signal);
}

export function cadastrarEmpresa(empresa) {
  return modoDemo ? cadastrarLocal(empresa) : cadastrarRemoto(empresa);
}

// ---------- Supabase (PostgREST via fetch, sem SDK) ----------

async function postRest(caminho, corpo, { signal, prefer } = {}) {
  const headers = { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' };
  // Chave legada (JWT) também vai no Authorization; a publishable (sb_publishable_…) não.
  if (SUPABASE_ANON_KEY.startsWith('eyJ')) headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
  if (prefer) headers.Prefer = prefer;

  const resposta = await fetch(`${SUPABASE_URL}/rest/v1/${caminho}`, {
    method: 'POST', headers, body: JSON.stringify(corpo), signal,
  });
  if (resposta.status === 409) throw new ErroCadastro('Este Instagram já está cadastrado.');
  if (!resposta.ok) throw new Error(`Erro ${resposta.status} ao falar com o servidor.`);
  return resposta.status === 204 || resposta.status === 201 ? null : resposta.json();
}

function buscarRemoto({ q, uf, cidade, categoria, origem, pagina = 0 }, signal) {
  return postRest('rpc/buscar_empresas', {
    p_q: q || null,
    p_uf: uf || null,
    p_cidade: cidade || null,
    p_categoria: categoria || null,
    p_lat: origem?.lat ?? null,
    p_lng: origem?.lng ?? null,
    p_limite: TAMANHO_PAGINA,
    p_offset: pagina * TAMANHO_PAGINA,
  }, { signal });
}

function cadastrarRemoto(empresa) {
  return postRest('empresas', empresa, { prefer: 'return=minimal' });
}

// ---------- Modo demonstração (localStorage) ----------

const CHAVE_LOCAL = 'catalogo-vermelho:empresas';

function lerLocal() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_LOCAL)) ?? [...EMPRESAS_DEMO];
  } catch {
    return [...EMPRESAS_DEMO];
  }
}

async function buscarLocal({ q, uf, cidade, categoria, origem, pagina = 0 }) {
  const termo = normalizar(q);
  const resultado = lerLocal()
    .filter((e) => (!uf || e.uf === uf)
      && (!cidade || e.cidade === cidade)
      && (!categoria || e.categoria === categoria)
      && (!termo || normalizar(`${e.nome} ${e.descricao ?? ''} ${e.instagram}`).includes(termo)))
    .map((e) => ({ ...e, distancia_km: origem ? distanciaKm(origem, e) : null }))
    .sort((a, b) => (a.distancia_km ?? 0) - (b.distancia_km ?? 0) || a.nome.localeCompare(b.nome, 'pt-BR'));

  const inicio = pagina * TAMANHO_PAGINA;
  return resultado.slice(inicio, inicio + TAMANHO_PAGINA);
}

async function cadastrarLocal(empresa) {
  const empresas = lerLocal();
  if (empresas.some((e) => e.instagram === empresa.instagram)) {
    throw new ErroCadastro('Este Instagram já está cadastrado.');
  }
  // Sem moderação no modo demo: entra direto na lista.
  empresas.push({ ...empresa, id: Date.now() });
  try {
    localStorage.setItem(CHAVE_LOCAL, JSON.stringify(empresas));
  } catch {
    throw new Error('Não foi possível salvar no navegador.');
  }
}
