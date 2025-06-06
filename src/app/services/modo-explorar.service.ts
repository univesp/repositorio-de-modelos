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

  private filtrosAtuaisSubject = new BehaviorSubject<{ [key: string]: string }>({});
  filtrosAtuais$ = this.filtrosAtuaisSubject.asObservable();

  setFiltrosAtuais(filtros: { [key: string]: string }) {
    this.filtrosAtuaisSubject.next(filtros);
  }

  getFiltrosAtuais(): { [key: string]: string } {
    return this.filtrosAtuaisSubject.getValue();
  }

}
