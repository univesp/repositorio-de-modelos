export interface ModeloCadastroRequest {
  ano: number;
  mes: number;
  dia: number;
  date: string;
  formato: string;
  titulo: string;
  descricao: string;
  link: string;
  tags: string[];
  curso: string[];
  area: string[];
  tipo: string[];
  tecnologias: string[];
  acessibilidade: string[];
  licenca: string[];
  hasCodigo: boolean;
  codigoLink?: string;
  autoria: string;
  hasEquipe: boolean;
  equipe?: {
    docente?: string;
    coordenacao?: string;
    roteirizacao?: string;
    layout?: string;
    ilustracao?: string;
    programacao?: string;
  };
  carousel?: boolean;
  destaque?: boolean;
}

// Se precisar de uma interface para a equipe separadamente:
export interface EquipeModelo {
  docente?: string;
  coordenacao?: string;
  roteirizacao?: string;
  layout?: string;
  ilustracao?: string;
  programacao?: string;
}