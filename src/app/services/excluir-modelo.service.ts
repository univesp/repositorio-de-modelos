import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ExcluirModeloService {
  private apiUrl = '/api'; // Usa o proxy configurado

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  /**
   * Exclui um modelo pelo ID
   */
  excluirModelo(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/modelos/${id}`);
  }

  /**
   * Abre diálogo de confirmação com SweetAlert2
   */
  async abrirConfirmacao(tituloModelo: string): Promise<boolean> {
    const resultado = await Swal.fire({
      title: 'Excluir Modelo',
      html: `
        <div style="text-align: center;">
          <p style="margin-bottom: 16px; font-size: 16px;">
            Tem certeza que deseja excluir o modelo <strong>"${tituloModelo}"</strong>?
          </p>
          <p style="color: #ff4444; font-size: 14px;">
            ⚠️ Esta ação não pode ser desfeita!
          </p>
        </div>
      `,
      icon: 'warning',
      iconColor: '#ff4444',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ff4444',
      cancelButtonColor: '#6c757d',
      reverseButtons: true,
      focusCancel: true,
      customClass: {
        confirmButton: 'swal2-confirm-excluir',
        cancelButton: 'swal2-cancel-excluir',
        popup: 'swal2-popup-excluir'
      }
    });

    return resultado.isConfirmed;
  }

  /**
   * Executa o fluxo completo de exclusão
   */
  async executarExclusao(modeloId: string, modeloNome: string): Promise<void> {
    const confirmado = await this.abrirConfirmacao(modeloNome);
    
    if (!confirmado) {
      return;
    }

    // Mostra loading enquanto processa
    Swal.fire({
      title: 'Excluindo...',
      text: 'Por favor, aguarde',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      await this.excluirModelo(modeloId).toPromise();
      
      // Fecha o loading e mostra sucesso
      Swal.close();
      
      await Swal.fire({
        title: 'Sucesso!',
        html: `
          <div style="text-align: center;">
            <div style="font-size: 60px; color: #4CAF50; margin-bottom: 20px;">✓</div>
            <p style="font-size: 16px;">
              Modelo excluído com sucesso!
            </p>
          </div>
        `,
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#4CAF50',
        timer: 3000,
        timerProgressBar: true
      });

      // Redireciona para a página inicial (dashboard) após exclusão
      this.router.navigate(['/']);
      
    } catch (error: any) {
      console.error('Erro ao excluir modelo:', error);
      
      // Fecha o loading e mostra erro
      Swal.close();
      
      let mensagemErro = 'Ocorreu um erro ao excluir o modelo.';
      
      // Mensagens específicas baseadas no status do erro
      if (error.status === 403) {
        mensagemErro = 'Você não tem permissão para excluir este modelo.';
      } else if (error.status === 404) {
        mensagemErro = 'Modelo não encontrado.';
      } else if (error.status === 500) {
        mensagemErro = 'Erro interno do servidor. Tente novamente mais tarde.';
      }
      
      await Swal.fire({
        title: 'Erro!',
        html: `
          <div style="text-align: center;">
            <div style="font-size: 60px; color: #ff4444; margin-bottom: 20px;">✗</div>
            <p style="font-size: 16px;">
              ${mensagemErro}
            </p>
            ${error.message ? `<p style="color: #999; font-size: 14px; margin-top: 10px;">${error.message}</p>` : ''}
          </div>
        `,
        icon: 'error',
        confirmButtonText: 'Entendi',
        confirmButtonColor: '#ff4444'
      });
    }
  }
}