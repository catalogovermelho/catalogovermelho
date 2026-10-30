import { test } from 'node:test';
import assert from 'node:assert/strict';
import { distanciaKm } from '../js/geo.js';
import { linksDeRota } from '../js/links.js';
import { normalizar } from '../js/texto.js';

test('distanciaKm São Paulo → Rio ≈ 360 km', () => {
  const km = distanciaKm({ lat: -23.5505, lng: -46.6333 }, { lat: -22.9068, lng: -43.1729 });
  assert.ok(km > 350 && km < 370, `obtido ${km}`);
});

test('linksDeRota oferece Maps, Waze, Uber e Apple Maps com a coordenada', () => {
  const links = linksDeRota({ lat: -23.5, lng: -46.6, nome: 'Bar & Cia' });
  assert.deepEqual(links.map((l) => l.app), ['Google Maps', 'Waze', 'Uber', 'Apple Maps']);
  assert.ok(links.every((l) => l.href.includes('-23.5')));
  assert.ok(links[2].href.includes('Bar%20%26%20Cia'));
});

test('normalizar remove acentos e caixa', () => {
  assert.equal(normalizar('  Açaí da ESQUINA '), 'acai da esquina');
});
