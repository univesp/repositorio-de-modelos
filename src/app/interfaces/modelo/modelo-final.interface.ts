export interface Modelo {
  id: string;
  ano: number;
  mes: number;
  dia: number;
  date: string;
  formato: string;
  titulo: string;
  descricao: string;
  link: string;
  tags: string[];
  imagem: File | null;
  curso: string[];
  area: string[];
  tipo: string[];
  tecnologias: string[];
  acessibilidade: string[];
  licenca: string[];
  hasCodigo: boolean;
  codigoZip: File | null;
  codigoLink: string | null;
  autoria: string;
  hasEquipe: boolean;
  equipe: {
    docente: string | null;
    coordenacao: string | null;
    roteirizacao: string | null;
    layout: string | null;
    ilustracao: string | null;
    programacao: string | null;
  };
}
