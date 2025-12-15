// services/salvos.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuthService, UserProfile } from './auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class SalvosService {
  private ultimoModeloRemovido: { modeloId: string, userProfile: UserProfile } | null = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  /**
   * VERIFICA SE UM MODELO ESTÁ SALVO
   */
  isModeloSalvo(modeloId: string): boolean {
    const userProfile = this.authService.getCurrentUserProfile();
    return userProfile?.salvos?.includes(modeloId) || false;
  }

  /**
   * ADICIONA AOS SALVOS
   */
  adicionarAosSalvos(modeloId: string): Observable<any> {
    const userProfile = this.authService.getCurrentUserProfile();
    
    if (!userProfile) {
      this.mostrarSnackbar('⚠️ Você precisa estar logado para salvar modelos', 'warning');
      return of(null);
    }

    console.log(`💾 Salvando modelo ${modeloId} para usuário ${userProfile.mongoId}`);

    return this.http.post(`/api/usuarios/${userProfile.mongoId}/salvos?modeloId=${modeloId}`, {}).pipe(
      tap(() => {
        console.log('✅ Modelo salvo na API');
        
        // Atualiza localmente
        const salvosAtuais = userProfile.salvos || [];
        const novosSalvos = [...salvosAtuais, modeloId];
        
        this.authService.updateUserProfile({
          salvos: novosSalvos
        });

        this.mostrarSnackbar('✅ Modelo salvo com sucesso!', 'success');
      }),
      catchError(error => {
        console.error('❌ Erro ao salvar modelo:', error);
        this.mostrarSnackbar('❌ Erro ao salvar modelo', 'error');
        return of(error);
      })
    );
  }

  /**
   * REMOVE DOS SALVOS
   */
  removerDosSalvos(modeloId: string): Observable<any> {
    const userProfile = this.authService.getCurrentUserProfile();
    
    if (!userProfile) {
      this.mostrarSnackbar('⚠️ Você precisa estar logado', 'warning');
      return of(null);
    }

    console.log(`🗑️ Removendo modelo ${modeloId} dos salvos do usuário ${userProfile.mongoId}`);

    // Salva para possível desfazer
    this.ultimoModeloRemovido = {
      modeloId: modeloId,
      userProfile: { ...userProfile }
    };

    return this.http.delete(`/api/usuarios/${userProfile.mongoId}/salvos/${modeloId}`).pipe(
      tap(() => {
        console.log('✅ Modelo removido da API');
        
        // Atualiza localmente
        const salvosAtuais = userProfile.salvos || [];
        const novosSalvos = salvosAtuais.filter(id => id !== modeloId);
        
        this.authService.updateUserProfile({
          salvos: novosSalvos
        });

        this.mostrarSnackbarComDesfazer('✅ Modelo removido dos salvos', modeloId);
      }),
      catchError(error => {
        console.error('❌ Erro ao remover modelo:', error);
        this.mostrarSnackbar('❌ Erro ao remover modelo', 'error');
        return of(error);
      })
    );
  }

  /**
   * DESFAZER REMOÇÃO
   */
  desfazerRemocao(): Observable<any> {
    if (!this.ultimoModeloRemovido) {
      return of(null);
    }

    const { modeloId, userProfile } = this.ultimoModeloRemovido;
    
    console.log(`↩️ Desfazendo remoção do modelo ${modeloId}`);

    return this.http.post(`/api/usuarios/${userProfile.mongoId}/salvos?modeloId=${modeloId}`, {}).pipe(
      tap(() => {
        console.log('✅ Remoção desfeita');
        
        const salvosAtuais = userProfile.salvos || [];
        const novosSalvos = [...salvosAtuais, modeloId];
        
        this.authService.updateUserProfile({
          salvos: novosSalvos
        });

        this.ultimoModeloRemovido = null;
        this.mostrarSnackbar('✅ Ação desfeita - Modelo readicionado!', 'success');
      }),
      catchError(error => {
        console.error('❌ Erro ao desfazer:', error);
        this.mostrarSnackbar('❌ Erro ao desfazer ação', 'error');
        return of(error);
      })
    );
  }

  /**
   * SNACKBAR COM DESFAZER
   */
  private mostrarSnackbarComDesfazer(mensagem: string, modeloId: string): void {
    const snackBarRef = this.snackBar.open(mensagem, 'Desfazer', {
      duration: 5000,
      panelClass: ['snackbar-warning'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });

    snackBarRef.onAction().subscribe(() => {
      console.log('🔄 Usuário clicou em Desfazer');
      this.desfazerRemocao().subscribe();
    });

    snackBarRef.afterDismissed().subscribe(() => {
      this.ultimoModeloRemovido = null;
    });
  }

  /**
   * SNACKBAR SIMPLES
   */
  private mostrarSnackbar(mensagem: string, tipo: 'success' | 'info' | 'error' | 'warning' = 'info'): void {
    const config = {
      duration: 3000,
      panelClass: [`snackbar-${tipo}`],
      horizontalPosition: 'center' as const,
      verticalPosition: 'top' as const
    };

    this.snackBar.open(mensagem, 'Fechar', config);
  }
}