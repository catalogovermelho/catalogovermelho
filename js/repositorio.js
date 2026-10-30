import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { distanciaKm } from './geo.js';
import { normalizar } from './texto.js';
import { EMPRESAS_DEMO } from './demo.js';

export const TAMANHO_PAGINA = 20;
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

/** @param {string} [captcha] token do Turnstile, exigido fora do modo demo */
export function cadastrarEmpresa(empresa, captcha) {
  return modoDemo ? cadastrarLocal(empresa) : cadastrarRemoto(empresa, captcha);
}

// ---------- Supabase (REST via fetch, sem SDK) ----------

function postSupabase(caminho, corpo, signal) {
  const headers = { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' };
  // Chave legada (JWT) também vai no Authorization; a publishable (sb_publishable_…) não.
  if (SUPABASE_ANON_KEY.startsWith('eyJ')) headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
  return fetch(`${SUPABASE_URL}/${caminho}`, {
    method: 'POST', headers, body: JSON.stringify(corpo), signal,
  });
}

async function buscarRemoto({ q, uf, cidade, categoria, origem, pagina = 0 }, signal) {
  const resposta = await postSupabase('rest/v1/rpc/buscar_empresas', {
    p_q: q || null,
    p_uf: uf || null,
    p_cidade: cidade || null,
    p_categoria: categoria || null,
    p_lat: origem?.lat ?? null,
    p_lng: origem?.lng ?? null,
    p_limite: TAMANHO_PAGINA,
    p_offset: pagina * TAMANHO_PAGINA,
  }, signal);
  if (!resposta.ok) throw new Error(`Erro ${resposta.status} ao buscar empresas.`);
  return resposta.json();
}

/** Grava pela Edge Function `cadastrar`, que valida o captcha. */
async function cadastrarRemoto(empresa, captcha) {
  const resposta = await postSupabase('functions/v1/cadastrar', { ...empresa, captcha });
  if (resposta.ok) return;
  const { erro } = await resposta.json().catch(() => ({}));
  if (resposta.status < 500 && erro) throw new ErroCadastro(erro);
  throw new Error(`Erro ${resposta.status} ao falar com o servidor.`);
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
