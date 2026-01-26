import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ModeloAPI } from '../interfaces/modelo/modelo-api.interface';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AtualizarModeloService {
  private apiUrl = '/api';
  
  // Limites máximos
  private readonly MAX_CAROUSEL = 5;
  private readonly MAX_DESTAQUES = 3;

  constructor(
    private http: HttpClient
  ) {
    //console.log('AtualizarModeloService inicializado');
  }

  /**
   * Obtém modelos com carousel=true
   */
  private getModelosCarousel(): Observable<ModeloAPI[]> {
    return this.http.get<ModeloAPI[]>(`${this.apiUrl}/modelos/list?carousel=true`);
  }

  /**
   * Obtém modelos com destaque=true
   */
  private getModelosDestaque(): Observable<ModeloAPI[]> {
    return this.http.get<ModeloAPI[]>(`${this.apiUrl}/modelos/list?destaque=true`);
  }

  /**
   * Verifica se pode adicionar ao carrossel
   */
  private podeAdicionarAoCarrrossel(): Observable<boolean> {
    return this.getModelosCarousel().pipe(
      map(modelos => modelos.length < this.MAX_CAROUSEL)
    );
  }

  /**
   * Verifica se pode adicionar aos destaques
   */
  private podeAdicionarAosDestaques(): Observable<boolean> {
    return this.getModelosDestaque().pipe(
      map(modelos => modelos.length < this.MAX_DESTAQUES)
    );
  }

  /**
   * Atualiza um modelo (PUT completo)
   */
  atualizarModelo(id: string, modeloData: ModeloAPI): Observable<ModeloAPI> {
    return this.http.put<ModeloAPI>(`${this.apiUrl}/modelos/${id}`, modeloData);
  }

  /**
   * Mostra mensagem de sucesso com SweetAlert
   */
  private mostrarSucesso(mensagem: string): void {
    Swal.fire({
      icon: 'success',
      title: 'Sucesso!',
      text: mensagem,
      timer: 3000,
      showConfirmButton: false,
      position: 'top-end',
      toast: true
    });
  }

  /**
   * Mostra mensagem de erro com SweetAlert
   */
  private mostrarErro(mensagem: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Erro!',
      text: mensagem,
      timer: 5000,
      showConfirmButton: true,
      position: 'center'
    });
  }

  /**
   * Mostra mensagem de informação com SweetAlert
   */
  private mostrarInfo(mensagem: string): void {
    Swal.fire({
      icon: 'info',
      title: 'Informação',
      text: mensagem,
      timer: 3000,
      showConfirmButton: false,
      position: 'top-end',
      toast: true
    });
  }

  /**
   * Mostra mensagem de limite máximo com SweetAlert
   */
  private mostrarLimiteMaximo(tipo: 'carrossel' | 'destaques'): void {
    const max = tipo === 'carrossel' ? this.MAX_CAROUSEL : this.MAX_DESTAQUES;
    const texto = tipo === 'carrossel' 
      ? 'carrossel' 
      : 'destaques';
    
    Swal.fire({
      icon: 'warning',
      title: 'Limite máximo atingido!',
      html: `O ${texto} já tem ${max} modelos.<br><br>
             <strong>Remova algum modelo do ${texto} para poder adicionar este.</strong>`,
      showConfirmButton: true,
      confirmButtonText: 'Entendi',
      confirmButtonColor: '#7155d8',
      position: 'center'
    });
  }

  /**
   * Executa o fluxo completo de adicionar ao topo COM VALIDAÇÃO DE LIMITE
   */
  executarAdicionarAoTopo(modeloAtual: ModeloAPI, modeloId: string, modeloNome: string): void {
    // Verifica se já está no topo
    if (modeloAtual.carousel === true) {
      this.mostrarInfo(`"${modeloNome}" já está no carrossel!`);
      return;
    }

    //console.log(`Verificando limite do carrossel para "${modeloNome}"...`);
    
    // Primeiro verifica se pode adicionar
    this.podeAdicionarAoCarrrossel().pipe(
      switchMap(podeAdicionar => {
        if (!podeAdicionar) {
          this.mostrarLimiteMaximo('carrossel');
          throw new Error('Limite máximo do carrossel atingido');
        }
        
        // Se pode adicionar, prossegue com a atualização
        //console.log(`Pode adicionar "${modeloNome}" ao carrossel`);
        
        const modeloAtualizado: ModeloAPI = {
          ...modeloAtual,
          carousel: true
        };
        
        return this.atualizarModelo(modeloId, modeloAtualizado);
      })
    ).subscribe({
      next: (modeloAtualizado) => {
        //console.log('Modelo atualizado com sucesso:', modeloAtualizado);
        this.mostrarSucesso(`"${modeloNome}" adicionado ao carrossel!`);
        
        // Atualiza o objeto local
        Object.assign(modeloAtual, modeloAtualizado);
      },
      error: (error) => {
        if (error.message === 'Limite máximo do carrossel atingido') {
          return; // Já mostrou o SweetAlert, não precisa mostrar erro
        }
        
        console.error('Erro ao atualizar modelo:', error);
        
        let mensagemErro = 'Erro ao adicionar ao carrossel';
        
        if (error.status === 403) {
          mensagemErro = 'Sem permissão para esta ação';
        } else if (error.status === 404) {
          mensagemErro = 'Modelo não encontrado';
        } else if (error.status === 500) {
          mensagemErro = 'Erro interno do servidor';
        }
        
        this.mostrarErro(mensagemErro);
      }
    });
  }

  /**
   * Método para remover do topo (carousel: false)
   */
  removerDoTopo(modeloAtual: ModeloAPI, modeloId: string, modeloNome: string): void {
    // Verifica se já não está no topo
    if (modeloAtual.carousel === false) {
      this.mostrarInfo(`"${modeloNome}" já não está no carrossel!`);
      return;
    }

    //console.log(`Removendo "${modeloNome}" do carrossel...`);
    
    // Cria cópia do modelo com carousel: false
    const modeloAtualizado: ModeloAPI = {
      ...modeloAtual,
      carousel: false
    };
    
    this.atualizarModelo(modeloId, modeloAtualizado).subscribe({
      next: (modeloAtualizado) => {
        //console.log('Modelo atualizado com sucesso:', modeloAtualizado);
        this.mostrarSucesso(`"${modeloNome}" removido do carrossel!`);
        
        // Atualiza o objeto local
        Object.assign(modeloAtual, modeloAtualizado);
      },
      error: (error) => {
        console.error('Erro ao atualizar modelo:', error);
        
        let mensagemErro = 'Erro ao remover do carrossel';
        
        if (error.status === 403) {
          mensagemErro = 'Sem permissão para esta ação';
        } else if (error.status === 404) {
          mensagemErro = 'Modelo não encontrado';
        } else if (error.status === 500) {
          mensagemErro = 'Erro interno do servidor';
        }
        
        this.mostrarErro(mensagemErro);
      }
    });
  }

  /**
   * Método para adicionar aos destaques COM VALIDAÇÃO DE LIMITE
   */
  adicionarAosDestaques(modeloAtual: ModeloAPI, modeloId: string, modeloNome: string): void {
    // Verifica se já está nos destaques
    if (modeloAtual.destaque === true) {
      this.mostrarInfo(`"${modeloNome}" já está nos destaques!`);
      return;
    }

    //console.log(`Verificando limite dos destaques para "${modeloNome}"...`);
    
    // Primeiro verifica se pode adicionar
    this.podeAdicionarAosDestaques().pipe(
      switchMap(podeAdicionar => {
        if (!podeAdicionar) {
          this.mostrarLimiteMaximo('destaques');
          throw new Error('Limite máximo dos destaques atingido');
        }
        
        // Se pode adicionar, prossegue com a atualização
        //console.log(`Pode adicionar "${modeloNome}" aos destaques`);
        
        const modeloAtualizado: ModeloAPI = {
          ...modeloAtual,
          destaque: true
        };
        
        return this.atualizarModelo(modeloId, modeloAtualizado);
      })
    ).subscribe({
      next: (modeloAtualizado) => {
        //console.log('Modelo atualizado com sucesso:', modeloAtualizado);
        this.mostrarSucesso(`"${modeloNome}" adicionado aos destaques!`);
        
        // Atualiza o objeto local
        Object.assign(modeloAtual, modeloAtualizado);
      },
      error: (error) => {
        if (error.message === 'Limite máximo dos destaques atingido') {
          return; // Já mostrou o SweetAlert, não precisa mostrar erro
        }
        
        console.error('Erro ao atualizar modelo:', error);
        
        let mensagemErro = 'Erro ao adicionar aos destaques';
        
        if (error.status === 403) {
          mensagemErro = 'Sem permissão para esta ação';
        } else if (error.status === 404) {
          mensagemErro = 'Modelo não encontrado';
        } else if (error.status === 500) {
          mensagemErro = 'Erro interno do servidor';
        }
        
        this.mostrarErro(mensagemErro);
      }
    });
  }

  /**
   * Método para remover dos destaques (destaque: false)
   */
  removerDosDestaques(modeloAtual: ModeloAPI, modeloId: string, modeloNome: string): void {
    // Verifica se já não está nos destaques
    if (modeloAtual.destaque === false) {
      this.mostrarInfo(`"${modeloNome}" já não está nos destaques!`);
      return;
    }

    //console.log(`Removendo "${modeloNome}" dos destaques...`);
    
    // Cria cópia do modelo com destaque: false
    const modeloAtualizado: ModeloAPI = {
      ...modeloAtual,
      destaque: false
    };
    
    this.atualizarModelo(modeloId, modeloAtualizado).subscribe({
      next: (modeloAtualizado) => {
        //console.log('Modelo atualizado com sucesso:', modeloAtualizado);
        this.mostrarSucesso(`"${modeloNome}" removido dos destaques!`);
        
        // Atualiza o objeto local
        Object.assign(modeloAtual, modeloAtualizado);
      },
      error: (error) => {
        console.error('Erro ao atualizar modelo:', error);
        
        let mensagemErro = 'Erro ao remover dos destaques';
        
        if (error.status === 403) {
          mensagemErro = 'Sem permissão para esta ação';
        } else if (error.status === 404) {
          mensagemErro = 'Modelo não encontrado';
        } else if (error.status === 500) {
          mensagemErro = 'Erro interno do servidor';
        }
        
        this.mostrarErro(mensagemErro);
      }
    });
  }
}