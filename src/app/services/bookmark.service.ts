import { Injectable } from '@angular/core';
import { SalvosService } from './salvos.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class BookmarkService {
  constructor(
    private salvosService: SalvosService,
    private authService: AuthService
  ) {}

  // Verifica se um modelo está salvo
  isSalvo(id: string): boolean {
    return this.salvosService.isModeloSalvo(id);
  }

  // Alterna entre salvar e remover dos salvos
  toggle(id: string): void {
    if (!this.authService.isSignedIn()) {
      console.log('Usuário precisa estar logado para salvar modelos');
      return;
    }

    if (this.isSalvo(id)) {
      this.salvosService.removerDosSalvos(id).subscribe({
        next: () => console.log('✅ Modelo removido dos salvos'),
        error: (error) => console.error('❌ Erro ao remover dos salvos:', error)
      });
    } else {
      this.salvosService.adicionarAosSalvos(id).subscribe({
        next: () => console.log('✅ Modelo adicionado aos salvos'),
        error: (error) => console.error('❌ Erro ao adicionar aos salvos:', error)
      });
    }
  }
}