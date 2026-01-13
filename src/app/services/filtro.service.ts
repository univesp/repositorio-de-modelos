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

  /**
   * Converte string de data do formato "13 de jan de 2026" para Date
   */
  private converterStringParaDate(dataStr: string): Date {
    if (!dataStr || dataStr === 'Data não disponível' || dataStr.trim() === '') {
      return new Date(0);
    }
    
    try {
      // Remove pontos e formata
      const dataLimpa = dataStr.toLowerCase().replace(/\./g, '');
      const match = dataLimpa.match(/(\d+)\s+de\s+(\w+)\s+de\s+(\d+)/);
      
      if (match) {
        const dia = parseInt(match[1], 10);
        const mesStr = match[2].toLowerCase().substring(0, 3);
        const ano = parseInt(match[3], 10);
        
        const meses: {[key: string]: number} = {
          'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
          'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
        };
        
        const mes = meses[mesStr] || 0;
        
        // Usa meio-dia para evitar problemas de fuso horário
        return new Date(ano, mes, dia, 12, 0, 0);
      }
      
      return new Date(dataStr);
    } catch (e) {
      return new Date(0);
    }
  }

  /**
   * Verifica se uma data está dentro de um intervalo
   */
  private dataEstaNoIntervalo(dataModelo: Date, intervalo: string): boolean {
    const hoje = new Date();
    const dataModeloLimpa = new Date(dataModelo.getFullYear(), dataModelo.getMonth(), dataModelo.getDate());
    
    switch (intervalo.toLowerCase()) {
      case 'este ano':
        return dataModeloLimpa.getFullYear() === hoje.getFullYear();
        
      case 'este mês':
        return dataModeloLimpa.getFullYear() === hoje.getFullYear() &&
               dataModeloLimpa.getMonth() === hoje.getMonth();
        
      case 'esta semana':
        // Calcula o início da semana (domingo)
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - hoje.getDay());
        inicioSemana.setHours(0, 0, 0, 0);
        
        // Calcula o fim da semana (sábado)
        const fimSemana = new Date(inicioSemana);
        fimSemana.setDate(inicioSemana.getDate() + 6);
        fimSemana.setHours(23, 59, 59, 999);
        
        // Ou alternativa: últimos 7 dias
        const seteDiasAtras = new Date(hoje);
        seteDiasAtras.setDate(hoje.getDate() - 7);
        seteDiasAtras.setHours(0, 0, 0, 0);
        
        // Escolha uma das opções acima:
        // Opção 1: Semana atual (domingo a sábado)
        // return dataModeloLimpa >= inicioSemana && dataModeloLimpa <= fimSemana;
        
        // Opção 2: Últimos 7 dias (mais intuitivo)
        return dataModeloLimpa >= seteDiasAtras && dataModeloLimpa <= hoje;
        
      default:
        return false;
    }
  }

  aplicarFiltros(modelos: Modelo[], filtros: { [key: string]: any }): Modelo[] {
    if (!filtros || Object.keys(filtros).length === 0) {
      return modelos;
    }

    //console.log('Aplicando filtros:', filtros);
    
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

        // 3. FILTRO DE DATA
        if (chave === 'data') {
          if (!modelo.date || modelo.date === 'Data não disponível') {
            return false;
          }
          
          // Converte a data do modelo para objeto Date
          const dataModelo = this.converterStringParaDate(modelo.date);
          
          // Verifica se a data está no intervalo selecionado
          const estaNoIntervalo = this.dataEstaNoIntervalo(dataModelo, valorFiltro);
          
          if (!estaNoIntervalo) return false;
          continue;
        }

        // 4. FILTROS POR PROPRIEDADE ESPECÍFICA
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
            console.warn(`Filtro desconhecido: ${chave}`);
        }
      }
      
      // Passou em todos os filtros
      return true;
    });
  }
}