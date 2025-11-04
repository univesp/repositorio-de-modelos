import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CarregamentoService {
  private itensPorPagina = 9;
  
  constructor() { }

  /**
   * Retorna uma parte da lista baseada na página atual
   */
  carregarPagina<T>(listaCompleta: T[], pagina: number): T[] {
    const startIndex = (pagina - 1) * this.itensPorPagina;
    const endIndex = startIndex + this.itensPorPagina;
    return listaCompleta.slice(startIndex, endIndex);
  }

  /**
   * Verifica se há mais itens para carregar
   */
  temMaisItens<T>(listaCompleta: T[], itensCarregados: number): boolean {
    return itensCarregados < listaCompleta.length;
  }

  /**
   * Retorna o número total de páginas
   */
  getTotalPaginas<T>(listaCompleta: T[]): number {
    return Math.ceil(listaCompleta.length / this.itensPorPagina);
  }

  getItensPorPagina(): number {
    return this.itensPorPagina;
  }
}