import { CATEGORIAS } from './dominio.js';
import { cadastrarEmpresa, ErroCadastro, modoDemo } from './repositorio.js';
import { montarCaptcha, renovarCaptcha, tokenCaptcha } from './captcha.js';
import { obterPosicao } from './geo.js';
import { validarEmpresa } from './validacao.js';
import { adicionarOpcoes, preencherCidades, preencherUfs } from './ui.js';

const form = document.getElementById('cadastro');
const resultado = document.getElementById('resultado');
const botaoEnviar = form.querySelector('[type="submit"]');

function mostrarErros(erros) {
  for (const saida of form.querySelectorAll('[data-erro]')) {
    const mensagem = erros[saida.dataset.erro] ?? '';
    saida.textContent = mensagem;
    form.elements[saida.dataset.erro].setAttribute('aria-invalid', String(Boolean(mensagem)));
  }
  const primeiroInvalido = form.querySelector('[aria-invalid="true"]');
  primeiroInvalido?.focus();
}

async function preencherLocalizacao({ currentTarget: botao }) {
  botao.disabled = true;
  try {
    const { lat, lng } = await obterPosicao();
    form.elements.coordenadas.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch (erro) {
    mostrarErros({ coordenadas: erro.message });
  } finally {
    botao.disabled = false;
  }
}

async function enviar(evento) {
  evento.preventDefault();
  resultado.textContent = '';
  const { empresa, erros } = validarEmpresa(Object.fromEntries(new FormData(form)));
  mostrarErros(erros);
  if (!empresa) return;

  const captcha = tokenCaptcha();
  if (!modoDemo && !captcha) {
    resultado.textContent = 'Confirme que você não é um robô.';
    return;
  }

  botaoEnviar.disabled = true;
  try {
    await cadastrarEmpresa(empresa, captcha);
    form.reset();
    form.elements.cidade.disabled = true;
    resultado.textContent = modoDemo
      ? 'Cadastrado! Já aparece no catálogo deste navegador.'
      : 'Recebido, camarada! Sua empresa aparece no catálogo após a aprovação.';
  } catch (erro) {
    resultado.textContent = erro instanceof ErroCadastro ? erro.message : 'Falha ao enviar. Tente novamente.';
  } finally {
    botaoEnviar.disabled = false;
    renovarCaptcha();
  }
}

function iniciar() {
  document.getElementById('aviso-demo').hidden = !modoDemo;
  adicionarOpcoes(form.elements.categoria, CATEGORIAS.map(({ id, nome }) => ({ valor: id, texto: nome })));
  preencherUfs(form.elements.uf);

  form.elements.uf.addEventListener('change', ({ target }) => {
    preencherCidades(form.elements.cidade, target.value).catch((erro) => mostrarErros({ cidade: erro.message }));
  });
  document.getElementById('localizar').addEventListener('click', preencherLocalizacao);
  form.addEventListener('submit', enviar);
  if (!modoDemo) {
    montarCaptcha(document.getElementById('captcha')).catch((erro) => { resultado.textContent = erro.message; });
  }
}

iniciar();
