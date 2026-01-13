import { Injectable } from '@angular/core';
import { Modelo } from '../interfaces/modelo/modelo.interface';
import { ModeloAPI } from '../interfaces/modelo/modelo-api.interface';
import { ImagemDefaultUtils } from '../utils/imagem-default.utils';

@Injectable({
  providedIn: 'root'
})
export class ModeloConverterService {
  
  /**
   * CONVERTE ModeloAPI PARA Modelo
   */
  converterAPIparaModelo(apiModelo: ModeloAPI): Modelo {
    const formatarData = (dataISO: string): string => {
      try {
        const date = new Date(dataISO);
        return date.toLocaleDateString('pt-BR', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        }).replace(/ de /g, ' ');
      } catch {
        return 'Data não disponível';
      }
    };

    const limparHTML = (html: string): string => {
      if (!html) return '';
      return html.replace(/<[^>]*>/g, '');
    };

    const imagemParaExibir = ImagemDefaultUtils.getImagemParaExibicao(apiModelo);

    // VERIFICA SE TEM CÓDIGO ZIP DISPONÍVEL
    // Tem código ZIP se tem codigoZipFileId OU codigoUrl
    const temCodigoZip = !!(apiModelo.codigoZipFileId || apiModelo.codigoUrl);

    return {
      id: apiModelo.id,
      titulo: apiModelo.titulo,
      recurso: apiModelo.formato,
      date: formatarData(apiModelo.date),
      curso: apiModelo.curso || [],
      disciplina: apiModelo.curso?.[0] || 'Disciplina não especificada',
      area: apiModelo.area || [],
      categorias: apiModelo.tipo || [],
      tipo: apiModelo.tipo || [],
      img_sm: imagemParaExibir,
      img_md: imagemParaExibir,
      img_lg: imagemParaExibir,
      descricao: limparHTML(apiModelo.descricao),
      autor: apiModelo.autoria || apiModelo.createdBy || 'Autor não informado',
      formato: apiModelo.formato,
      tecnologia: apiModelo.tecnologias || [],
      acessibilidade: apiModelo.acessibilidade || [],
      hasMobile: false,
      hasCodigo: apiModelo.hasCodigo || false,
      temCodigoZip: temCodigoZip,
      codigoZipFileId: apiModelo.codigoZipFileId || null,
      codigoUrl: apiModelo.codigoUrl || null,
      isDestaque: apiModelo.destaque || false,
      hasEquipe: apiModelo.hasEquipe || false,
      equipe: apiModelo.equipe ? {
        docente: apiModelo.equipe.docente || '',
        coordenacao: apiModelo.equipe.coordenacao || '',
        roteirizacao: apiModelo.equipe.roteirizacao || '',
        ilustracao: apiModelo.equipe.ilustracao || '',
        layout: apiModelo.equipe.layout || '',
        programacao: apiModelo.equipe.programacao || ''
      } : undefined,
      tags: apiModelo.tags || [],
      link: apiModelo.link || '',
      github: apiModelo.codigoLink || undefined,
      isSalvo: false, // Será atualizado pelo BookmarkService
      licenca: apiModelo.licenca?.join(', ') || 'Não especificada',
      carousel: apiModelo.carousel || false,
    };
  }

  /**
   * CONVERTE ARRAY DE ModeloAPI PARA Modelo[]
   */
  converterArrayAPIparaModelo(apiModelos: ModeloAPI[]): Modelo[] {
    return apiModelos.map(apiModelo => this.converterAPIparaModelo(apiModelo));
  }
}