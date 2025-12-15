// services/filtro.service.ts - VERSÃO MAIS SIMPLES
import { Injectable } from '@angular/core';
import { Modelo } from '../interfaces/modelo/modelo.interface';

@Injectable({ providedIn: 'root' })
export class FiltroService {
  
  private normalizeString(str: string | null | undefined): string {
    if (!str) return '';
    return str
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  aplicarFiltros(modelos: Modelo[], filtros: { [key: string]: any }): Modelo[] {
    if (!filtros || Object.keys(filtros).length === 0) {
      return modelos;
    }

    console.log('🎯 Aplicando filtros:', filtros);
    
    return modelos.filter(modelo => {
      // Verifica cada filtro
      for (const [chave, valorFiltro] of Object.entries(filtros)) {
        // Ignora filtros vazios
        if (!valorFiltro || valorFiltro === '' || valorFiltro === '[Selecione]') {
          continue;
        }

        // 1. BUSCA GERAL
        if (chave === 'search') {
          const termo = this.normalizeString(valorFiltro);
          const camposParaBuscar = [
            modelo.titulo,
            modelo.descricao,
            modelo.disciplina,
            modelo.autor,
            modelo.tags?.join(' ') || '',
            modelo.curso?.join(' ') || '',
            modelo.area?.join(' ') || '',
            modelo.tecnologia?.join(' ') || '',
            modelo.categorias?.join(' ') || ''
          ];
          
          const encontrou = camposParaBuscar.some(campo => 
            this.normalizeString(campo).includes(termo)
          );
          
          if (!encontrou) return false;
          continue;
        }

        // 2. FILTRO TAGS
        if (chave === 'tags') {
          const tagBuscada = this.normalizeString(valorFiltro);
          const encontrouTag = modelo.tags?.some(tag => 
            this.normalizeString(tag).includes(tagBuscada)
          ) || false;
          
          if (!encontrouTag) return false;
          continue;
        }

        // 3. FILTROS POR PROPRIEDADE ESPECÍFICA
        switch (chave) {
          case 'area':
            const areaBuscada = this.normalizeString(valorFiltro);
            const temArea = modelo.area?.some(area => 
              this.normalizeString(area) === areaBuscada
            ) || false;
            if (!temArea) return false;
            break;
            
          case 'curso':
            const cursoBuscado = this.normalizeString(valorFiltro);
            const temCurso = modelo.curso?.some(curso => 
              this.normalizeString(curso) === cursoBuscado
            ) || false;
            if (!temCurso) return false;
            break;
            
          case 'disciplina':
            if (this.normalizeString(modelo.disciplina) !== this.normalizeString(valorFiltro)) {
              return false;
            }
            break;
            
          case 'categorias':
          case 'tipo': // compatibilidade
            const categoriaBuscada = this.normalizeString(valorFiltro);
            const temCategoria = modelo.categorias?.some(categoria => 
              this.normalizeString(categoria) === categoriaBuscada
            ) || false;
            if (!temCategoria) return false;
            break;
            
          case 'tecnologia':
            const tecnologiaBuscada = this.normalizeString(valorFiltro);
            const temTecnologia = modelo.tecnologia?.some(tech => 
              this.normalizeString(tech) === tecnologiaBuscada
            ) || false;
            if (!temTecnologia) return false;
            break;
            
          case 'acessibilidade':
            const acessibilidadeBuscada = this.normalizeString(valorFiltro);
            const temAcessibilidade = modelo.acessibilidade?.some(acess => 
              this.normalizeString(acess) === acessibilidadeBuscada
            ) || false;
            if (!temAcessibilidade) return false;
            break;
            
          case 'formato':
            if (this.normalizeString(modelo.formato) !== this.normalizeString(valorFiltro)) {
              return false;
            }
            break;
            
          default:
            console.warn(`⚠️ Filtro desconhecido: ${chave}`);
        }
      }
      
      // Passou em todos os filtros
      return true;
    });
  }
}