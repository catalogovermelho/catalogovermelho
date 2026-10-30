const API = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados';
const cache = new Map();

/** Municípios da UF, via API pública do IBGE, com cache em memória e na sessão. */
export function listarCidades(uf) {
  if (!cache.has(uf)) cache.set(uf, carregar(uf));
  return cache.get(uf);
}

async function carregar(uf) {
  const chave = `cidades:${uf}`;
  const salvo = lerSessao(chave);
  if (salvo) return salvo;

  const resposta = await fetch(`${API}/${uf}/municipios?orderBy=nome`);
  if (!resposta.ok) {
    cache.delete(uf);
    throw new Error('Falha ao carregar cidades.');
  }
  const cidades = (await resposta.json()).map(({ nome }) => nome);
  gravarSessao(chave, cidades);
  return cidades;
}

function lerSessao(chave) {
  try {
    return JSON.parse(sessionStorage.getItem(chave));
  } catch {
    return null;
  }
}

function gravarSessao(chave, valor) {
  try {
    sessionStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // Armazenamento indisponível: segue só com o cache em memória.
  }
}
