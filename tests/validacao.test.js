import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizarImagem, normalizarInstagram, normalizarSite, parseCoordenadas, validarEmpresa } from '../js/validacao.js';

test('normalizarInstagram aceita @, nome e URL', () => {
  assert.equal(normalizarInstagram('@Loja.Boa'), 'loja.boa');
  assert.equal(normalizarInstagram('https://www.instagram.com/loja_boa/?hl=pt'), 'loja_boa');
  assert.equal(normalizarInstagram('  loja  '), 'loja');
});

test('parseCoordenadas lê o formato do Google Maps e restringe ao Brasil', () => {
  assert.deepEqual(parseCoordenadas('-23.55052, -46.63331'), { lat: -23.55052, lng: -46.63331 });
  assert.deepEqual(parseCoordenadas('-23.5 -46.6'), { lat: -23.5, lng: -46.6 });
  assert.equal(parseCoordenadas('48.85, 2.35'), null);
  assert.equal(parseCoordenadas('abc'), null);
});

test('normalizarSite completa o protocolo e rejeita lixo', () => {
  assert.equal(normalizarSite('ifood.com.br/delivery/x'), 'https://ifood.com.br/delivery/x');
  assert.equal(normalizarSite(''), null);
  assert.equal(normalizarSite('não é link'), undefined);
});

test('normalizarImagem aceita só https', () => {
  assert.equal(normalizarImagem(''), null);
  assert.equal(normalizarImagem('https://cdn.loja.com/logo.png'), 'https://cdn.loja.com/logo.png');
  assert.equal(normalizarImagem('http://cdn.loja.com/logo.png'), undefined);
  assert.equal(normalizarImagem('logo.png'), undefined);
});

test('validarEmpresa exige nome, instagram, ramo, local e GPS', () => {
  const { empresa, erros } = validarEmpresa({});
  assert.equal(empresa, null);
  assert.deepEqual(Object.keys(erros).sort(), ['categoria', 'cidade', 'coordenadas', 'instagram', 'nome', 'uf']);
});

test('validarEmpresa monta o registro limpo', () => {
  const { empresa } = validarEmpresa({
    nome: ' Pastelaria ', instagram: '@Pastel', categoria: 'alimentacao', descricao: '',
    site: 'ifood.com.br', uf: 'SP', cidade: 'São Paulo', coordenadas: '-23.5, -46.6',
  });
  assert.deepEqual(empresa, {
    nome: 'Pastelaria', instagram: 'pastel', categoria: 'alimentacao', descricao: null,
    site: 'https://ifood.com.br/', imagem: null, uf: 'SP', cidade: 'São Paulo', lat: -23.5, lng: -46.6,
  });
});
