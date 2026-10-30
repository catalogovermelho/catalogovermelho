import { UFS } from './dominio.js';
import { listarCidades } from './ibge.js';

export function adicionarOpcoes(select, itens) {
  const fragmento = document.createDocumentFragment();
  for (const { valor, texto } of itens) fragmento.append(new Option(texto, valor));
  select.append(fragmento);
}

export function preencherUfs(select) {
  adicionarOpcoes(select, UFS.map(({ sigla, nome }) => ({ valor: sigla, texto: nome })));
}

/**
 * Recarrega o select com as cidades da UF, mantendo a primeira opção como placeholder.
 * Textos opcionais do placeholder: data-sem-uf, data-carregando e data-escolha.
 */
export async function preencherCidades(select, uf, selecionada = '') {
  const placeholder = select.options[0];
  const { semUf, carregando, escolha } = select.dataset;
  select.length = 1;
  select.disabled = true;
  if (!uf) {
    if (semUf) placeholder.text = semUf;
    return;
  }

  if (carregando) placeholder.text = carregando;
  const cidades = await listarCidades(uf);
  if (select.form?.elements.uf.value !== uf) return; // UF trocada durante o carregamento
  if (escolha) placeholder.text = escolha;
  adicionarOpcoes(select, cidades.map((nome) => ({ valor: nome, texto: nome })));
  select.value = selecionada;
  select.disabled = false;
}
