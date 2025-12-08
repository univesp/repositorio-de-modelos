import { SelectsList } from './selects-list';

// Configuração base com todas as opções que podem vir do SelectsList
const baseConfig = [
  { key: 'curso', label: 'CURSO' },
  { key: 'area', label: 'ÁREA' },
  { key: 'tipo', label: 'TIPO' },
  { key: 'tecnologia', label: 'TECNOLOGIA', selectKey: 'tecnologias' }, // Mapeia chave diferente
  { key: 'acessibilidade', label: 'ACESSIBILIDADE' },
  { key: 'licenca', label: 'LICENÇA' }
];

// Filtros que não existem no SelectsList
const additionalFilters = [
  { 
    key: 'formato', 
    label: 'FORMATO', 
    placeholder: '[ Selecione ]', 
    opcoes: ['[ Selecione ]', 'REA Univesp', 'Jogo', 'Site', 'Recurso de Programação', 'Modelo Externo'] 
  },
  { 
    key: 'data', 
    label: 'DATA', 
    placeholder: '[ Selecione ]', 
    opcoes: ['[ Selecione ]', 'Este Mês', 'Esta Semana', 'Este Ano'] 
  }
];

// Gera os filtros a partir do SelectsList
const filtersFromSelectsList = baseConfig.map(config => {
  const selectKey = config.selectKey || config.key; // Usa selectKey se definido, senão usa key
  const selectConfig = SelectsList.find(s => s.key === selectKey);
  
  return {
    key: config.key,
    label: config.label,
    placeholder: '[ Selecione ]',
    opcoes: ['[ Selecione ]', ...(selectConfig?.opcoes || []) ] // Pega opções do SelectsList ou array vazio
  };
});

// Combina todos os filtros
export const FilterConfigList = [
  ...filtersFromSelectsList,
  ...additionalFilters
];