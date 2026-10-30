export const CATEGORIAS = Object.freeze([
  { id: 'alimentacao', nome: 'Alimentação' },
  { id: 'entretenimento', nome: 'Entretenimento' },
  { id: 'moda', nome: 'Moda' },
  { id: 'saude-beleza', nome: 'Saúde e beleza' },
  { id: 'servicos', nome: 'Serviços' },
  { id: 'comercio', nome: 'Comércio' },
  { id: 'educacao', nome: 'Educação' },
  { id: 'tecnologia', nome: 'Tecnologia' },
  { id: 'casa-construcao', nome: 'Casa e construção' },
  { id: 'automotivo', nome: 'Automotivo' },
  { id: 'pets', nome: 'Pets' },
  { id: 'turismo', nome: 'Turismo e hospedagem' },
  { id: 'outros', nome: 'Outros' },
]);

export const UFS = Object.freeze([
  ['AC', 'Acre'], ['AL', 'Alagoas'], ['AP', 'Amapá'], ['AM', 'Amazonas'],
  ['BA', 'Bahia'], ['CE', 'Ceará'], ['DF', 'Distrito Federal'], ['ES', 'Espírito Santo'],
  ['GO', 'Goiás'], ['MA', 'Maranhão'], ['MT', 'Mato Grosso'], ['MS', 'Mato Grosso do Sul'],
  ['MG', 'Minas Gerais'], ['PA', 'Pará'], ['PB', 'Paraíba'], ['PR', 'Paraná'],
  ['PE', 'Pernambuco'], ['PI', 'Piauí'], ['RJ', 'Rio de Janeiro'], ['RN', 'Rio Grande do Norte'],
  ['RS', 'Rio Grande do Sul'], ['RO', 'Rondônia'], ['RR', 'Roraima'], ['SC', 'Santa Catarina'],
  ['SP', 'São Paulo'], ['SE', 'Sergipe'], ['TO', 'Tocantins'],
].map(([sigla, nome]) => Object.freeze({ sigla, nome })));

const NOME_CATEGORIA = new Map(CATEGORIAS.map(({ id, nome }) => [id, nome]));

export const nomeCategoria = (id) => NOME_CATEGORIA.get(id) ?? id;
export const isCategoria = (id) => NOME_CATEGORIA.has(id);
export const isUf = (sigla) => UFS.some((uf) => uf.sigla === sigla);
