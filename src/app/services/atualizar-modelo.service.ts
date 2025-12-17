import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ModeloAPI } from '../interfaces/modelo/modelo-api.interface';

@Injectable({
  providedIn: 'root'
})
export class AtualizarModeloService {
  private apiUrl = '/api';

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {
    console.log('✅ AtualizarModeloService inicializado');
  }

  /**
   * Atualiza um modelo (PUT completo)
   */
  atualizarModelo(id: string, modeloData: ModeloAPI): Observable<ModeloAPI> {
    return this.http.put<ModeloAPI>(`${this.apiUrl}/modelos/${id}`, modeloData);
  }

  /**
   * Método específico para adicionar ao topo (carousel: true)
   */
  adicionarAoTopo(modeloAtual: ModeloAPI, modeloId: string): Observable<ModeloAPI> {
    // Cria cópia do modelo com carousel: true
    const modeloAtualizado: ModeloAPI = {
      ...modeloAtual,
      carousel: true
    };

    console.log('📤 Enviando para atualizar carousel:', modeloAtualizado);
    
    return this.atualizarModelo(modeloId, modeloAtualizado);
  }

  /**
   * Mostra mensagem de sucesso
   */
  private mostrarSucesso(mensagem: string): void {
    this.snackBar.open(mensagem, 'Fechar', {
      duration: 3000,
      panelClass: ['snackbar-success'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  /**
   * Mostra mensagem de erro
   */
  private mostrarErro(mensagem: string): void {
    this.snackBar.open(mensagem, 'Fechar', {
      duration: 5000,
      panelClass: ['snackbar-error'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  /**
   * Mostra mensagem de informação
   */
  private mostrarInfo(mensagem: string): void {
    this.snackBar.open(mensagem, 'Fechar', {
      duration: 3000,
      panelClass: ['snackbar-info'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  /**
   * Executa o fluxo completo de adicionar ao topo
   */
  executarAdicionarAoTopo(modeloAtual: ModeloAPI, modeloId: string, modeloNome: string): void {
    // Verifica se já está no topo
    if (modeloAtual.carousel === true) {
      this.mostrarInfo(`"${modeloNome}" já está no carrossel!`);
      return;
    }

    console.log(`🔄 Adicionando "${modeloNome}" ao carrossel...`);
    
    this.adicionarAoTopo(modeloAtual, modeloId).subscribe({
      next: (modeloAtualizado) => {
        console.log('✅ Modelo atualizado com sucesso:', modeloAtualizado);
        this.mostrarSucesso(`"${modeloNome}" adicionado ao carrossel!`);
        
        // Atualiza o objeto local
        Object.assign(modeloAtual, modeloAtualizado);
      },
      error: (error) => {
        console.error('❌ Erro ao atualizar modelo:', error);
        
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

    console.log(`🔄 Removendo "${modeloNome}" do carrossel...`);
    
    // Cria cópia do modelo com carousel: false
    const modeloAtualizado: ModeloAPI = {
      ...modeloAtual,
      carousel: false
    };
    
    this.atualizarModelo(modeloId, modeloAtualizado).subscribe({
      next: (modeloAtualizado) => {
        console.log('✅ Modelo atualizado com sucesso:', modeloAtualizado);
        this.mostrarSucesso(`"${modeloNome}" removido do carrossel!`);
        
        // Atualiza o objeto local
        Object.assign(modeloAtual, modeloAtualizado);
      },
      error: (error) => {
        console.error('❌ Erro ao atualizar modelo:', error);
        
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
   * Método para adicionar aos destaques (destaque: true)
   */
  adicionarAosDestaques(modeloAtual: ModeloAPI, modeloId: string, modeloNome: string): void {
    // Verifica se já está nos destaques
    if (modeloAtual.destaque === true) {
      this.mostrarInfo(`"${modeloNome}" já está nos destaques!`);
      return;
    }

    console.log(`🔄 Adicionando "${modeloNome}" aos destaques...`);
    
    // Cria cópia do modelo com destaque: true
    const modeloAtualizado: ModeloAPI = {
      ...modeloAtual,
      destaque: true
    };
    
    this.atualizarModelo(modeloId, modeloAtualizado).subscribe({
      next: (modeloAtualizado) => {
        console.log('✅ Modelo atualizado com sucesso:', modeloAtualizado);
        this.mostrarSucesso(`"${modeloNome}" adicionado aos destaques!`);
        
        // Atualiza o objeto local
        Object.assign(modeloAtual, modeloAtualizado);
      },
      error: (error) => {
        console.error('❌ Erro ao atualizar modelo:', error);
        
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
}