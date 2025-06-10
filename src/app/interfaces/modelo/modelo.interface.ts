export interface Modelo {
  id: string;
  titulo: string;
  recurso: string;
  date: string;
  curso: string[];
  disciplina: string;
  area: string[];
  categorias: string[];
  tipo: string[];
  img_sm: string;
  img_md: string;
  img_lg: string;
  descricao: string;
  autor: string;
  formato: string;
  tecnologia: string[];
  acessibilidade?: string[];
  hasMobile: boolean;
  hasCodigo: boolean;
  isDestaque: boolean;
  hasEquipe: boolean;
  equipe?: {
    docente?: string;
    coordenacao?: string;
    roteirizacao?: string;
    ilustracao?: string;
    layout?: string;
    programacao?: string;
  };
  tags: string[];
  link?: string;
  github?: string;
  isSalvo?: boolean;
  licenca: string;
}
