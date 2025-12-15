// services/bookmark.service.ts
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

  isSalvo(id: string): boolean {
    return this.salvosService.isModeloSalvo(id);
  }

  toggle(id: string): void {
    if (!this.authService.isSignedIn()) {
      console.log('⚠️ Usuário precisa estar logado para salvar modelos');
      return;
    }

    if (this.isSalvo(id)) {
      this.salvosService.removerDosSalvos(id).subscribe();
    } else {
      this.salvosService.adicionarAosSalvos(id).subscribe();
    }
  }
}