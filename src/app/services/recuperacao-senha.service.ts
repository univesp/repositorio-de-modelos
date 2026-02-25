import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RecuperacaoSenhaService {
  private baseUrl = environment.apiBaseUrl;
  private apiUrl = `${this.baseUrl}/auth`;

  constructor(private http: HttpClient) {}

  solicitarRecuperacaoSenha(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/recuperacao-de-senha`, { email });
  }

  redefinirSenha(token: string, novaSenha: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post(
      `${this.apiUrl}/nova-senha`, 
      { password: novaSenha },
      { headers }
    );
  }

   // Método para extrair token da URL (útil para a rota)
   extrairTokenDaUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('token');
    } catch {
      // Se não for uma URL válida, tenta extrair de uma string qualquer
      const match = url.match(/[?&]token=([^&]+)/);
      return match ? match[1] : null;
    }
  }
}