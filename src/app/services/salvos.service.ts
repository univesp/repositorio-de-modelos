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

  // Adiciona um modelo aos salvos via API
  adicionarAosSalvos(modeloId: string): Observable<any> {
    const userProfile = this.authService.getCurrentUserProfile();
    
    if (!userProfile) {
      throw new Error('Usuário não autenticado');
    }

    return this.http.post(`/api/usuarios/${userProfile.mongoId}/salvos?modeloId=${modeloId}`, {}).pipe(
      tap(() => {
        // Atualiza o perfil localmente
        const salvosAtuais = userProfile.salvos || [];
        const novosSalvos = [...salvosAtuais, modeloId];
        
        this.authService.updateUserProfile({
          salvos: novosSalvos
        });

        this.mostrarSnackbar('✅ Modelo salvo com sucesso!', 'success');
      })
    );
  }

  // Remove um modelo dos salvos via API - VERSÃO CORRIGIDA
  removerDosSalvos(modeloId: string): Observable<any> {
    const userProfile = this.authService.getCurrentUserProfile();
    
    if (!userProfile) {
      throw new Error('Usuário não autenticado');
    }

    console.log(`🗑️ Removendo modelo ${modeloId} dos salvos do usuário ${userProfile.mongoId}`);

    return this.http.delete(`/api/usuarios/${userProfile.mongoId}/salvos/${modeloId}`).pipe(
      tap(() => {
        console.log('✅ Modelo removido dos salvos via API');
        
        // Atualiza o perfil localmente
        const salvosAtuais = userProfile.salvos || [];
        const novosSalvos = salvosAtuais.filter(id => id !== modeloId);
        
        this.authService.updateUserProfile({
          salvos: novosSalvos
        });

        this.mostrarSnackbar('🗑️ Modelo removido dos salvos', 'info');
      })
    );
  }

  // Método para mostrar snackbars
  private mostrarSnackbar(mensagem: string, tipo: 'success' | 'info' | 'error' = 'info'): void {
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
      case 'info':
        return ['snackbar-info'];
      default:
        return ['snackbar-info'];
    }
  }

  // Carrega os modelos completos baseado nos IDs salvos
  private carregarModelosSalvos(idsSalvos: string[]): void {
    const modelosFiltrados = this.todosModelos.filter(modelo => 
      idsSalvos.includes(modelo.id)
    );
    
    this.modelosSalvosSubject.next(modelosFiltrados);
  }

  // Verifica se um modelo está salvo
  isModeloSalvo(modeloId: string): boolean {
    const userProfile = this.authService.getCurrentUserProfile();
    return userProfile?.salvos?.includes(modeloId) || false;
  }

  // Obtém a lista atual de modelos salvos
  getModelosSalvos(): Modelo[] {
    return this.modelosSalvosSubject.value;
  }
}