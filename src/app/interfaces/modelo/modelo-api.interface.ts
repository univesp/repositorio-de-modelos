// interfaces/modelo/modelo-api.interface.ts
export interface ModeloAPI {
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
  curso: string[];
  area: string[];
  tipo: string[];
  tecnologias: string[];
  acessibilidade: string[];
  licenca: string[];
  hasCodigo: boolean;
  codigoLink: string | null;
  autoria: string;
  hasEquipe: boolean;
  imagemFileId: string | null;
  codigoZipFileId: string | null;
  imagemUrl: string | null;
  codigoUrl: string | null;
  equipe?: {
    docente: string;
    coordenacao: string;
    roteirizacao: string;
    layout: string;
    ilustracao: string;
    programacao: string;
  };
  carousel: boolean;
  destaque: boolean;
  createdBy: string;
}