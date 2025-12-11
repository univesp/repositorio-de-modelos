import { Selects } from "../interfaces/selects/selects.interface";

export const SelectsList: Selects[] = [
  { 
    key: 'curso', 
    label: 'Curso',  
    opcoes: ['Administração', 'Ciência de Dados', 'Engenharia de Computação', 'Engenharia de Produção', 'Habil. em Língua Portuguesa', 'Matemática', 'Pedagogia', 'Tecnologia da Informação', 'Tec. em Processos Gerenciais', 'Acessibilidade'],
    obrigatorio: false,
    maxSelecoes: 3
  },
  { 
    key: 'area', 
    label: 'Área de Conhecimento',  
    opcoes: ['Artes e Humanidades', 'Artes Linguísticas', 'Ciências Aplicadas', 'Ciências Biológicas', 'Ciências Físicas', 'Ciências Sociais', 'Comunicação', 'Direito', 'Educação e Cultura', 'História', 'Matemática', 'Negócios', 'Profissão', 'Tecnologia'],
    obrigatorio: true,
    maxSelecoes: 2
  },
  { 
    key: 'tipo', 
    label: 'Tipo',  
    opcoes: ['Adivinhe a Resposta', 'Antes e Depois', 'Apresentação de Slides', 'Arrastar e Soltar', 'Caça-Palavras', 'Cartões Interativos', 'Cenário de Ramificação', 'Classificação em Grupos', 'Combinar', 'Conjunto de Quiz', 'Desembaralhar', 'Encontrar a Correspondência', 'Escolha de Imagem', 'Flashcards', 'Imagem Interativa', 'Jogo da Memória', 'Linha do Tempo', 'Livro Interativo', 'Mapa Mental', 'Múltipla Escolha', 'Página Expositiva', 'Palavras Cruzadas', 'Pergunta Verdadeiro/Falso', 'Preencher as Lacunas', 'Quebra-cabeça', 'Questionário', 'Sequenciamento de Imagens', 'Simulação interativa', 'Vídeo Interativo', 'Virar as peças', 'Visita virtual 360'],
    obrigatorio: true,
    maxSelecoes: 5
  },
  { 
    key: 'tecnologias', 
    label: 'Tecnologias',  
    opcoes: ['Back-end', 'Banco de Dados', 'CSS3', 'Front-end', 'HTML5', 'Inteligência Artificial', 'Javascript', 'Realidade Aumentada', 'Realidade Mista', 'Realidade Virtual', 'WebGL', 'WebXR', 'Unity'],
    obrigatorio: true,
    maxSelecoes: 5
  },
  { 
    key: 'acessibilidade', 
    label: 'Acessibilidade',  
    opcoes: ['Auditiva', 'Descrição de áudio', 'Descrição longa', 'Legenda', 'Legendas literais', 'Textual', 'Transcrição', 'Visual'],
    obrigatorio: false,
    maxSelecoes: 3
  },
  { 
    key: 'licenca', 
    label: 'Licença',  
    opcoes: ['Alguns direitos reservados', 'Domínio Público', 'Remix condicional e compartilhamento', 'Somente compartilhamento', 'Uso educacional', 'Uso irrestrito / CCO', 'Uso restrito'],
    obrigatorio: false,
    maxSelecoes: 2
  },
];