import { Selects } from "../interfaces/selects/selects.interface";

export const SelectsList: Selects[] = [
  { 
    key: 'curso', 
    label: 'Curso',  
    opcoes: ['Administração', 'Ciência de Dados', 'Engenharia de Computação', 'Engenharia de Produção', 'Matemática', 'Tecnologia da Informação', 'Pedagogia', 'Processos Gerenciais'],
    obrigatorio: true
  },
  { 
    key: 'area', 
    label: 'Área de Conhecimento',  
    opcoes: ['Ciências Biológicas', 'Direito', 'Matemática', 'Negócios', 'Tecnologia da Informação'],
    obrigatorio: true
  },
  { 
    key: 'tipo', 
    label: 'Tipo',  
    opcoes: ['Interativo', 'Abas', 'Accordions', 'Lightbox', 'Questionário'],
    obrigatorio: true
  },
  { 
    key: 'tecnologias', 
    label: 'Tecnologias',  
    opcoes: ['CSS3', 'HTML5', 'Javascript', 'Realidade Virtual'],
    obrigatorio: true
  },
  { 
    key: 'acessibilidade', 
    label: 'Acessibilidade',  
    opcoes: ['Auditiva', 'Descrição de áudio', 'Legenda', 'Transcrição'],
    obrigatorio: false
  },
  { 
    key: 'licenca', 
    label: 'Licença',  
    opcoes: ['Alguns direitos reservados', 'Domínio Público', 'Uso educacional', 'Uso irrestrito / CCO', 'Uso restrito'],
    obrigatorio: false
  },
];