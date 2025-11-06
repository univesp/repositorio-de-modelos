import { Injectable } from '@angular/core';

export interface PaginationConfig {
  paginaAtual: number;
  itensPorPagina: number;
  totalItens: number;
  totalPaginas: number;
  paginasParaExibir: number[];
}

@Injectable({
  providedIn: 'root'
})
export class PaginationService {
  
  inicializarPaginacao(itens: any[], itensPorPagina: number = 9): PaginationConfig {
    const totalItens = itens.length;
    const totalPaginas = Math.ceil(totalItens / itensPorPagina);
    
    return {
      paginaAtual: 1,
      itensPorPagina,
      totalItens,
      totalPaginas,
      paginasParaExibir: this.calcularPaginasParaExibir(1, totalPaginas)
    };
  }

  obterItensPaginados<T>(itens: T[], config: PaginationConfig): T[] {
    const startIndex = (config.paginaAtual - 1) * config.itensPorPagina;
    const endIndex = startIndex + config.itensPorPagina;
    return itens.slice(startIndex, endIndex);
  }

  irParaPagina(pagina: number, config: PaginationConfig): PaginationConfig {
    const novaConfig = { ...config };
    
    if (pagina >= 1 && pagina <= config.totalPaginas) {
      novaConfig.paginaAtual = pagina;
      novaConfig.paginasParaExibir = this.calcularPaginasParaExibir(pagina, config.totalPaginas);
    }
    
    return novaConfig;
  }

  proximaPagina(config: PaginationConfig): PaginationConfig {
    return this.irParaPagina(config.paginaAtual + 1, config);
  }

  paginaAnterior(config: PaginationConfig): PaginationConfig {
    return this.irParaPagina(config.paginaAtual - 1, config);
  }

  irParaPrimeiraPagina(config: PaginationConfig): PaginationConfig {
    return this.irParaPagina(1, config);
  }

  irParaUltimaPagina(config: PaginationConfig): PaginationConfig {
    return this.irParaPagina(config.totalPaginas, config);
  }

  atualizarPaginacaoComNovosItens(itens: any[], config: PaginationConfig): PaginationConfig {
    const totalItens = itens.length;
    const totalPaginas = Math.ceil(totalItens / config.itensPorPagina);
    
    let novaPaginaAtual = config.paginaAtual;
    if (novaPaginaAtual > totalPaginas && totalPaginas > 0) {
      novaPaginaAtual = totalPaginas;
    } else if (novaPaginaAtual < 1) {
      novaPaginaAtual = 1;
    }
    
    return {
      ...config,
      paginaAtual: novaPaginaAtual,
      totalItens,
      totalPaginas,
      paginasParaExibir: this.calcularPaginasParaExibir(novaPaginaAtual, totalPaginas)
    };
  }

  private calcularPaginasParaExibir(paginaAtual: number, totalPaginas: number, maxPaginasVisiveis: number = 5): number[] {
    if (totalPaginas <= maxPaginasVisiveis) {
      return Array.from({ length: totalPaginas }, (_, i) => i + 1);
    }

    let startPage: number;
    let endPage: number;

    const maxPagesBeforeCurrent = Math.floor(maxPaginasVisiveis / 2);
    const maxPagesAfterCurrent = Math.ceil(maxPaginasVisiveis / 2) - 1;

    if (paginaAtual <= maxPagesBeforeCurrent) {
      startPage = 1;
      endPage = maxPaginasVisiveis;
    } else if (paginaAtual + maxPagesAfterCurrent >= totalPaginas) {
      startPage = totalPaginas - maxPaginasVisiveis + 1;
      endPage = totalPaginas;
    } else {
      startPage = paginaAtual - maxPagesBeforeCurrent;
      endPage = paginaAtual + maxPagesAfterCurrent;
    }

    return Array.from(
      { length: (endPage - startPage) + 1 },
      (_, i) => startPage + i
    );
  }
}