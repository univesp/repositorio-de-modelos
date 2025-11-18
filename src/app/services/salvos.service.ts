import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthService, UserProfile } from './auth.service';
import { Modelo } from '../interfaces/modelo/modelo.interface';
import { Modeloslist } from '../data/modelos-list';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class SalvosService {
  private modelosSalvosSubject = new BehaviorSubject<Modelo[]>([]);
  modelosSalvos$ = this.modelosSalvosSubject.asObservable();

  // Controle para desfazer
  private ultimoModeloRemovido: { modeloId: string, userProfile: UserProfile } | null = null;

  private todosModelos: Modelo[] = Modeloslist;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.authService.userProfile$.subscribe(profile => {
      if (profile && profile.salvos) {
        this.carregarModelosSalvos(profile.salvos);
      } else {
        this.modelosSalvosSubject.next([]);
      }
    });
  }

  // Remove um modelo dos salvos via API - VERSÃO COM DESFAZER
  removerDosSalvos(modeloId: string): Observable<any> {
    const userProfile = this.authService.getCurrentUserProfile();
    
    if (!userProfile) {
      throw new Error('Usuário não autenticado');
    }

    //console.log(` Removendo modelo ${modeloId} dos salvos do usuário ${userProfile.mongoId}`);

    // SALVA INFO PARA POSSÍVEL DESFAZER
    this.ultimoModeloRemovido = {
      modeloId: modeloId,
      userProfile: { ...userProfile } // Cópia do perfil
    };

    return this.http.delete(`/api/usuarios/${userProfile.mongoId}/salvos/${modeloId}`).pipe(
      tap(() => {
        //console.log(' Modelo removido dos salvos via API');
        
        // Atualiza o perfil localmente
        const salvosAtuais = userProfile.salvos || [];
        const novosSalvos = salvosAtuais.filter(id => id !== modeloId);
        
        this.authService.updateUserProfile({
          salvos: novosSalvos
        });

        // SNACKBAR COM BOTÃO DESFAZER
        this.mostrarSnackbarComDesfazer(' Modelo removido dos salvos', modeloId);
      })
    );
  }

  // MÉTODO: Desfazer remoção
  desfazerRemocao(): Observable<any> {
    if (!this.ultimoModeloRemovido) {
      throw new Error('Nada para desfazer');
    }

    const { modeloId, userProfile } = this.ultimoModeloRemovido;
    
    //console.log(`Desfazendo remoção do modelo ${modeloId}`);

    return this.http.post(`/api/usuarios/${userProfile.mongoId}/salvos?modeloId=${modeloId}`, {}).pipe(
      tap(() => {
        //console.log('Remoção desfeita - modelo readicionado aos salvos');
        
        // Atualiza o perfil localmente
        const salvosAtuais = userProfile.salvos || [];
        const novosSalvos = [...salvosAtuais, modeloId];
        
        this.authService.updateUserProfile({
          salvos: novosSalvos
        });

        this.ultimoModeloRemovido = null; // Limpa após desfazer
        
        this.mostrarSnackbar('Ação desfeita - Modelo readicionado!', 'success');
      })
    );
  }

  // Snackbar com botão Desfazer
  private mostrarSnackbarComDesfazer(mensagem: string, modeloId: string): void {
    const snackBarRef = this.snackBar.open(mensagem, 'Desfazer', {
      duration: 5000, // 5 segundos para desfazer
      panelClass: ['snackbar-warning'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });

    // AÇÃO DO BOTÃO "DESFAZER"
    snackBarRef.onAction().subscribe(() => {
      //console.log('Usuário clicou em Desfazer');
      this.desfazerRemocao().subscribe({
        error: (error) => {
          //console.error('Erro ao desfazer:', error);
          this.mostrarSnackbar('Erro ao desfazer ação', 'error');
        }
      });
    });

    // QUANDO O SNACKBAR FECHA SOZINHO (timeout)
    snackBarRef.afterDismissed().subscribe(() => {
      //console.log('Snackbar fechado - limpando histórico de desfazer');
      this.ultimoModeloRemovido = null;
    });
  }

  // Método para mostrar snackbars normais
  private mostrarSnackbar(mensagem: string, tipo: 'success' | 'info' | 'error' | 'warning' = 'info'): void {
    const config = {
      duration: 3000,
      panelClass: this.getSnackbarClass(tipo),
      horizontalPosition: 'center' as const,
      verticalPosition: 'top' as const
    };

    this.snackBar.open(mensagem, 'Fechar', config);
  }

  // Método para classes CSS dos snackbars
  private getSnackbarClass(tipo: string): string[] {
    switch (tipo) {
      case 'success':
        return ['snackbar-success'];
      case 'error':
        return ['snackbar-error'];
      case 'warning':
        return ['snackbar-warning'];
      case 'info':
        return ['snackbar-info'];
      default:
        return ['snackbar-info'];
    }
  }

  private carregarModelosSalvos(idsSalvos: string[]): void {
    const modelosFiltrados = this.todosModelos.filter(modelo => 
      idsSalvos.includes(modelo.id)
    );
    
    this.modelosSalvosSubject.next(modelosFiltrados);
  }

  isModeloSalvo(modeloId: string): boolean {
    const userProfile = this.authService.getCurrentUserProfile();
    return userProfile?.salvos?.includes(modeloId) || false;
  }

  getModelosSalvos(): Modelo[] {
    return this.modelosSalvosSubject.value;
  }

  adicionarAosSalvos(modeloId: string): Observable<any> {
    const userProfile = this.authService.getCurrentUserProfile();
    
    if (!userProfile) {
      throw new Error('Usuário não autenticado');
    }

    return this.http.post(`/api/usuarios/${userProfile.mongoId}/salvos?modeloId=${modeloId}`, {}).pipe(
      tap(() => {
        const salvosAtuais = userProfile.salvos || [];
        const novosSalvos = [...salvosAtuais, modeloId];
        
        this.authService.updateUserProfile({
          salvos: novosSalvos
        });

        this.mostrarSnackbar('✅ Modelo salvo com sucesso!', 'success');
      })
    );
  }
}