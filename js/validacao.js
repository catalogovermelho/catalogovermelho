import { isCategoria, isUf } from './dominio.js';

const INSTAGRAM = /^[a-z0-9._]{1,30}$/;
const COORDENADAS = /^\s*(-?\d{1,2}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/;
const LIMITES_BRASIL = { latMin: -34, latMax: 6, lngMin: -74, lngMax: -28 };

/** Aceita "@loja", "loja" ou a URL do perfil. */
export function normalizarInstagram(valor = '') {
  return valor.trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^@/, '')
    .split(/[/?#]/)[0]
    .toLowerCase();
}

/** Aceita "-23.55, -46.63", formato copiado do Google Maps. */
export function parseCoordenadas(valor = '') {
  const match = COORDENADAS.exec(valor);
  if (!match) return null;
  const [lat, lng] = [Number(match[1]), Number(match[2])];
  const { latMin, latMax, lngMin, lngMax } = LIMITES_BRASIL;
  const dentroDoBrasil = lat >= latMin && lat <= latMax && lng >= lngMin && lng <= lngMax;
  return dentroDoBrasil ? { lat, lng } : null;
}

export function normalizarSite(valor = '') {
  const site = valor.trim();
  if (!site) return null;
  const comProtocolo = /^https?:\/\//i.test(site) ? site : `https://${site}`;
  try {
    const url = new URL(comProtocolo);
    return url.hostname.includes('.') ? url.href : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Valida o formulário de cadastro.
 * @returns {{ empresa: object|null, erros: Record<string, string> }}
 */
export function validarEmpresa(dados) {
  const erros = {};
  const nome = dados.nome?.trim() ?? '';
  const instagram = normalizarInstagram(dados.instagram);
  const descricao = dados.descricao?.trim() || null;
  const cidade = dados.cidade?.trim() ?? '';
  const coordenadas = parseCoordenadas(dados.coordenadas);
  const site = normalizarSite(dados.site);

  if (nome.length < 2 || nome.length > 80) erros.nome = 'Informe um nome entre 2 e 80 caracteres.';
  if (!INSTAGRAM.test(instagram)) erros.instagram = 'Informe um @ do Instagram válido.';
  if (!isCategoria(dados.categoria)) erros.categoria = 'Escolha um ramo.';
  if (descricao && descricao.length > 280) erros.descricao = 'Máximo de 280 caracteres.';
  if (site === undefined) erros.site = 'Link inválido.';
  if (!isUf(dados.uf)) erros.uf = 'Escolha o estado.';
  if (cidade.length < 2) erros.cidade = 'Escolha a cidade.';
  if (!coordenadas) erros.coordenadas = 'Coordenada inválida ou fora do Brasil. Ex.: -23.5505, -46.6333';

  if (Object.keys(erros).length) return { empresa: null, erros };

  return {
    empresa: {
      nome, instagram, categoria: dados.categoria, descricao, site,
      uf: dados.uf, cidade, lat: coordenadas.lat, lng: coordenadas.lng,
    },
    erros,
  };
}
