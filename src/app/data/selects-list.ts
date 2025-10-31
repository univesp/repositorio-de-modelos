import { Selects } from "../interfaces/selects/selects.interface";

export const SelectsList: Selects[] = [
  { 
    key: 'curso', 
    label: 'Curso',  
    opcoes: ['Administração', 'Ciência de Dados', 'Engenharia de Computação', 'Engenharia de Produção', 'Matemática', 'Tecnologia da Informação', 'Pedagogia', 'Processos Gerenciais'],
    obrigatorio: false,
    maxSelecoes: 3
  },
  { 
    key: 'area', 
    label: 'Área de Conhecimento',  
    opcoes: ['Ciências Biológicas', 'Direito', 'Matemática', 'Negócios', 'Tecnologia da Informação'],
    obrigatorio: true,
    maxSelecoes: 2
  },
  { 
    key: 'tipo', 
    label: 'Tipo',  
    opcoes: ['Interativo', 'Abas', 'Accordions', 'Lightbox', 'Questionário'],
    obrigatorio: true,
    maxSelecoes: 5
  },
  { 
    key: 'tecnologias', 
    label: 'Tecnologias',  
    opcoes: ['CSS3', 'HTML5', 'Javascript', 'Realidade Virtual'],
    obrigatorio: true,
    maxSelecoes: 5
  },
  { 
    key: 'acessibilidade', 
    label: 'Acessibilidade',  
    opcoes: ['Auditiva', 'Descrição de áudio', 'Legenda', 'Transcrição'],
    obrigatorio: false,
    maxSelecoes: 3
  },
  { 
    key: 'licenca', 
    label: 'Licença',  
    opcoes: ['Alguns direitos reservados', 'Domínio Público', 'Uso educacional', 'Uso irrestrito / CCO', 'Uso restrito'],
    obrigatorio: false,
    maxSelecoes: 2
  },
];