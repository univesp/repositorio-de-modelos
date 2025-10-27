// image.service.ts - VERSÃO CORRETA
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ImageService {

  constructor(
    private authService: AuthService,
    private sanitizer: DomSanitizer
  ) { }

  /**
   * Carrega a imagem de perfil usando o endpoint específico da API
   * O interceptor vai adicionar automaticamente o token
   */
  getProfileImage(mongoId: string): Observable<SafeUrl> {
   // console.log('🖼️ Carregando imagem via API para:', mongoId);
    
    return this.authService.getProfileImage(mongoId).pipe(
      map(blob => {
        // Cria uma Blob URL a partir do blob recebido
        const blobUrl = URL.createObjectURL(blob);
       // console.log('✅ Blob URL criada, tamanho:', blob.size, 'tipo:', blob.type);
        
        // Torna a URL segura para o Angular
        return this.sanitizer.bypassSecurityTrustUrl(blobUrl);
      })
    );
  }

  revokeImageUrl(blobUrl: string): void {
    if (blobUrl && blobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrl);
     // console.log('🗑️ Blob URL revogada');
    }
  }
}