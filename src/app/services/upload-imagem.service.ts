import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer } from '@angular/platform-browser';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class UploadImagemService {
  private apiUrl = '/api';

  // Tipos de imagem permitidos
  private readonly TIPOS_PERMITIDOS = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml'
  ];

  // Tamanho máximo: 5MB
  private readonly TAMANHO_MAXIMO = 5 * 1024 * 1024;

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer
  ) {}

  /**
   * Obtém a imagem de um modelo específico
   * Retorna como Blob para criar URL
   */
  getImagemModelo(modeloId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/modelos/${modeloId}/imagem`, {
      responseType: 'blob',
      headers: new HttpHeaders({
        'Accept': 'image/*'
      })
    });
  }

  /**
   * Cria uma URL segura a partir de um Blob
   */
  criarUrlDeBlob(blob: Blob): string {
    return URL.createObjectURL(blob);
  }

  /**
   * Libera a URL do blob da memória
   */
  liberarUrlBlob(url: string): void {
    URL.revokeObjectURL(url);
  }

  /**
   * Upload de imagem para um modelo específico
   */
  uploadImagemModelo(modeloId: string, arquivoImagem: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', arquivoImagem);
    
    return this.http.put(`${this.apiUrl}/modelos/${modeloId}/imagem`, formData);
  }

  /**
   * Remove a imagem de um modelo
   */
  removerImagemModelo(modeloId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/modelos/${modeloId}/imagem`);
  }

  /**
   * Remove a imagem com SweetAlert e recarrega a página
   */
  async executarRemocaoImagem(modeloId: string, modeloNome: string): Promise<boolean> {
    const result = await Swal.fire({
      title: 'Remover imagem?',
      text: `Tem certeza que deseja remover a imagem de "${modeloNome}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, remover!',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (!result.isConfirmed) {
      return false;
    }

    try {
      // Mostra loading
      Swal.fire({
        title: 'Removendo imagem...',
        text: 'Aguarde um momento',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      await this.removerImagemModelo(modeloId).toPromise();

      // Recarrega a página
      setTimeout(() => {
        window.location.reload();
      }, 500);

      return true;

    } catch (error: any) {
      Swal.close();
      
      let mensagemErro = 'Erro ao remover imagem';
      
      if (error.status === 401) {
        mensagemErro = 'Não autorizado. Faça login novamente.';
      } else if (error.status === 403) {
        mensagemErro = 'Sem permissão para remover imagem.';
      } else if (error.status === 404) {
        mensagemErro = 'Imagem não encontrada.';
      }

      await Swal.fire({
        title: 'Erro!',
        text: mensagemErro,
        icon: 'error',
        confirmButtonText: 'OK'
      });

      return false;
    }
  }

  /**
   * Valida o arquivo antes do upload
   */
  validarArquivo(arquivo: File): { valido: boolean; mensagem?: string } {
    if (!arquivo) {
      return { valido: false, mensagem: 'Nenhum arquivo selecionado' };
    }

    if (!this.TIPOS_PERMITIDOS.includes(arquivo.type)) {
      return { 
        valido: false, 
        mensagem: `Tipo de arquivo não permitido. Use: ${this.TIPOS_PERMITIDOS.join(', ')}` 
      };
    }

    if (arquivo.size > this.TAMANHO_MAXIMO) {
      return { 
        valido: false, 
        mensagem: `Arquivo muito grande. Máximo: ${this.formatarTamanho(this.TAMANHO_MAXIMO)}` 
      };
    }

    return { valido: true };
  }

  /**
   * Formata tamanho em bytes para string legível
   */
  formatarTamanho(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Mostra mensagem de sucesso
   */
  mostrarSucesso(mensagem: string): void {
    this.snackBar.open(`✅ ${mensagem}`, 'Fechar', {
      duration: 3000,
      panelClass: ['snackbar-success'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  /**
   * Mostra mensagem de erro
   */
  mostrarErro(mensagem: string): void {
    this.snackBar.open(`❌ ${mensagem}`, 'Fechar', {
      duration: 5000,
      panelClass: ['snackbar-error'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  /**
   * Executa o fluxo completo de upload COM LOADING
   */
  async executarUpload(modeloId: string, modeloNome: string, arquivo: File): Promise<boolean> {
    const validacao = this.validarArquivo(arquivo);
    if (!validacao.valido) {
      this.mostrarErro(validacao.mensagem!);
      return false;
    }

    // Mostra loading
    let swalInstance: any;
    try {
      swalInstance = Swal.fire({
        title: 'Enviando imagem...',
        text: 'Isso pode levar alguns segundos',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Faz o upload
      await this.uploadImagemModelo(modeloId, arquivo).toPromise();

      // Fecha o loading
      Swal.close();

      // AGORA ESPERA A IMAGEM CARREGAR ANTES DE MOSTRAR SUCESSO
      // Retorna true, mas a mensagem de sucesso será mostrada pelo componente
      // depois que a imagem for carregada
      return true;
      
    } catch (error: any) {
      // Fecha loading em caso de erro
      if (swalInstance) {
        Swal.close();
      }
      
      let mensagemErro = 'Erro ao fazer upload da imagem';
      
      if (error.status === 413) {
        mensagemErro = 'Arquivo muito grande para o servidor';
      } else if (error.status === 415) {
        mensagemErro = 'Tipo de imagem não suportado';
      } else if (error.status === 403) {
        mensagemErro = 'Sem permissão para alterar a imagem';
      } else if (error.status === 404) {
        mensagemErro = 'Modelo não encontrado';
      }
      
      this.mostrarErro(mensagemErro);
      return false;
    }
  }
}