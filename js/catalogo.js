import { CATEGORIAS, nomeCategoria } from './dominio.js';
import { buscarEmpresas, modoDemo, TAMANHO_PAGINA } from './repositorio.js';
import { formatarDistancia, obterPosicao } from './geo.js';
import { fotoInstagram, linkInstagram, linksDeRota } from './links.js';
import { debounce } from './texto.js';
import { preencherCidades, preencherUfs } from './ui.js';

const form = document.getElementById('filtros');
const lista = document.getElementById('lista');
const status = document.getElementById('status');
const botaoMais = document.getElementById('mais');
const botaoPerto = document.getElementById('perto');
const modelo = document.getElementById('tpl-empresa');

const estado = { pagina: 0, origem: null, controle: null };

function lerFiltros() {
  const dados = new FormData(form);
  return {
    q: dados.get('q').trim(),
    uf: dados.get('uf'),
    cidade: dados.get('cidade') ?? '',
    categoria: dados.get('categoria'),
  };
}

/** Mantém os filtros na URL para que a busca possa ser compartilhada. */
function sincronizarUrl(filtros) {
  const params = new URLSearchParams(Object.entries(filtros).filter(([, valor]) => valor));
  const busca = params.size ? `?${params}` : location.pathname;
  history.replaceState(null, '', busca);
}

function renderizarEmpresa(empresa) {
  const no = modelo.content.firstElementChild.cloneNode(true);
  const definir = (seletor, texto) => { no.querySelector(seletor).textContent = texto; };

  no.dataset.categoria = empresa.categoria;
  definir('.empresa__ramo', nomeCategoria(empresa.categoria));
  definir('.empresa__nome', empresa.nome);
  const distancia = empresa.distancia_km == null ? '' : ` · ${formatarDistancia(empresa.distancia_km)}`;
  definir('.empresa__local', `${empresa.cidade} / ${empresa.uf}${distancia}`);
  definir('.empresa__descricao', empresa.descricao ?? '');

  const instagram = no.querySelector('.empresa__instagram');
  instagram.href = linkInstagram(empresa.instagram);
  instagram.setAttribute('aria-label', `Instagram de ${empresa.nome}`);
  definir('.empresa__arroba', `@${empresa.instagram}`);

  const avatar = no.querySelector('.empresa__avatar');
  avatar.addEventListener('error', () => avatar.remove(), { once: true });
  avatar.src = fotoInstagram(empresa.instagram);

  if (empresa.site) {
    const site = no.querySelector('.empresa__site');
    site.href = empresa.site;
    site.hidden = false;
  }

  definir('.rota__coordenada', `${empresa.lat.toFixed(5)}, ${empresa.lng.toFixed(5)}`);
  no.querySelector('.rota__menu').append(...linksDeRota(empresa).map(({ app, href }) => {
    const item = document.createElement('li');
    const link = Object.assign(document.createElement('a'), {
      href, target: '_blank', rel: 'noopener', textContent: `Abrir no ${app}`,
    });
    item.append(link);
    return item;
  }));
  return no;
}

async function carregar({ acumular = false } = {}) {
  estado.controle?.abort();
  estado.controle = new AbortController();
  estado.pagina = acumular ? estado.pagina + 1 : 0;

  const filtros = lerFiltros();
  if (!acumular) sincronizarUrl(filtros);
  status.textContent = 'Carregando…';
  botaoMais.hidden = true;

  try {
    const empresas = await buscarEmpresas(
      { ...filtros, origem: estado.origem, pagina: estado.pagina },
      estado.controle.signal,
    );
    const nos = empresas.map(renderizarEmpresa);
    if (acumular) lista.append(...nos); else lista.replaceChildren(...nos);

    const total = lista.childElementCount;
    status.textContent = total ? `${total} empresa${total > 1 ? 's' : ''} encontrada${total > 1 ? 's' : ''}` : 'Nenhuma empresa encontrada. Que tal cadastrar a sua?';
    botaoMais.hidden = empresas.length < TAMANHO_PAGINA;
  } catch (erro) {
    if (erro.name !== 'AbortError') status.textContent = erro.message;
  }
}

async function alternarPerto() {
  if (estado.origem) {
    estado.origem = null;
  } else {
    status.textContent = 'Obtendo sua localização…';
    try {
      estado.origem = await obterPosicao();
    } catch (erro) {
      status.textContent = erro.message;
      return;
    }
  }
  botaoPerto.setAttribute('aria-pressed', String(Boolean(estado.origem)));
  carregar();
}

function montarRamos() {
  const grupo = form.querySelector('.ramos');
  const base = grupo.querySelector('.ramo');
  grupo.append(...CATEGORIAS.map(({ id, nome }) => {
    const ramo = base.cloneNode(true);
    const radio = ramo.querySelector('input');
    radio.value = id;
    radio.checked = false;
    ramo.querySelector('span').textContent = nome;
    return ramo;
  }));
}

function fecharMenusDeRota({ target }) {
  for (const menu of lista.querySelectorAll('.rota[open]')) {
    if (!menu.contains(target)) menu.open = false;
  }
}

/** Aplica filtros vindos da URL (link compartilhado). */
async function restaurarFiltros() {
  const params = new URLSearchParams(location.search);
  const { q, uf, categoria, cidade } = form.elements;
  q.value = params.get('q') ?? '';
  uf.value = params.get('uf') ?? '';
  const radio = [...categoria].find((r) => r.value === (params.get('categoria') ?? ''));
  if (radio) radio.checked = true;
  if (uf.value) await preencherCidades(cidade, uf.value, params.get('cidade') ?? '').catch(() => {});
}

function mostrarAvisoCadastro() {
  if (new URLSearchParams(location.search).get('cadastro') !== 'ok') return;
  const aviso = document.getElementById('aviso-cadastro');
  aviso.textContent = modoDemo
    ? 'Cadastrado! Sua empresa já aparece no catálogo deste navegador.'
    : 'Recebido, camarada! Sua empresa aparece no catálogo após a aprovação.';
  aviso.hidden = false;
}

function iniciar() {
  document.getElementById('aviso-demo').hidden = !modoDemo;
  mostrarAvisoCadastro();
  preencherUfs(form.elements.uf);
  montarRamos();

  const buscarComAtraso = debounce(() => carregar(), 300);
  form.addEventListener('input', (evento) => {
    if (evento.target.name === 'q') buscarComAtraso();
  });
  form.addEventListener('change', async ({ target }) => {
    if (target.name === 'q') return;
    if (target.name === 'uf') {
      try {
        await preencherCidades(form.elements.cidade, target.value);
      } catch (erro) {
        status.textContent = erro.message;
      }
    }
    carregar();
  });
  form.addEventListener('submit', (evento) => {
    evento.preventDefault();
    carregar();
  });
  botaoMais.addEventListener('click', () => carregar({ acumular: true }));
  botaoPerto.addEventListener('click', alternarPerto);
  document.addEventListener('click', fecharMenusDeRota);

  restaurarFiltros().then(() => carregar());
}

iniciar();
