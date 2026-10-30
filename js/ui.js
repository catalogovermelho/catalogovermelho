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

/** Recarrega o select de cidades da UF, preservando a primeira opção (placeholder). */
export async function preencherCidades(select, uf, selecionada = '') {
  select.length = 1;
  select.disabled = true;
  if (!uf) return;

  const cidades = await listarCidades(uf);
  if (select.form?.elements.uf.value !== uf) return; // UF trocada durante o carregamento
  adicionarOpcoes(select, cidades.map((nome) => ({ valor: nome, texto: nome })));
  select.value = selecionada;
  select.disabled = false;
}
