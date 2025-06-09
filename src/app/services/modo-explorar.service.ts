import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ 
  providedIn: 'root' 
})
export class ModoExplorarService {
  private modoExplorarAtivoSubject = new BehaviorSubject<boolean>(false);
  modoExplorarAtivo$ = this.modoExplorarAtivoSubject.asObservable();

  private modeloIdSubject = new BehaviorSubject<number | null>(null);
  modeloId$ = this.modeloIdSubject.asObservable();

  private filtrosAtuaisSubject = new BehaviorSubject<{ [key: string]: string }>({});
  filtrosAtuais$ = this.filtrosAtuaisSubject.asObservable();

  setModoExplorarAtivo(ativo: boolean) {
    this.modoExplorarAtivoSubject.next(ativo);
  }

  setModeloId(id: number | null) {
    this.modeloIdSubject.next(id);
  }

  getModeloId(): number | null {
    return this.modeloIdSubject.getValue();
  }

  getModoExplorarAtivo(): boolean {
    return this.modoExplorarAtivoSubject.getValue();
  }

  setFiltrosAtuais(filtros: { [key: string]: string }) {
    this.filtrosAtuaisSubject.next(filtros);
  }

  getFiltrosAtuais(): { [key: string]: string } {
    return this.filtrosAtuaisSubject.getValue();
  }

  // Reset de filtros com opção de manter um específico
  resetFiltros(filtroParaManter?: string): void {
    const currentFiltros = this.filtrosAtuaisSubject.value;
    const novosFiltros: { [key: string]: string } = {};

    // Reseta todos para vazio (ou pode usar '[Selecione]' se preferir)
    Object.keys(currentFiltros).forEach(key => {
      novosFiltros[key] = (key === filtroParaManter) ? currentFiltros[key] : '';
    });

    this.filtrosAtuaisSubject.next(novosFiltros);
  }

  // Inicializa os filtros com placeholders
  inicializarFiltros(placeholders: { [key: string]: string }): void {
    this.filtrosAtuaisSubject.next(placeholders);
  }

  resetAll(): void {
    this.modoExplorarAtivoSubject.next(false);  // Reseta para false
    this.modeloIdSubject.next(null);            // Reseta para null
    this.filtrosAtuaisSubject.next({});        // Reseta para objeto vazio
  }

}
