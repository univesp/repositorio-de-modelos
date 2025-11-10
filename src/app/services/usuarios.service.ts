import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable, tap } from 'rxjs';

export interface NovoUsuario {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  role: string;
  instituicao: string;
  cargo: string;
}

export interface Usuario {
  _id: string;
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  nome: string | null;
  imagemFileId: string | null;
  imagemUrl: string | null;
  instituicao: string;
  cargo: string;
  salvos: string[] | null;
  criados: string[] | null;
  enabled: boolean;
  username: string;
  authorities: Array<{ authority: string }>;
  accountNonExpired: boolean;
  accountNonLocked: boolean;
  credentialsNonExpired: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private apiUrl = '/api/usuarios';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Cria um novo usuário (apenas ADMIN)
   */
  criarUsuario(usuario: NovoUsuario): Observable<Usuario> {
    const headers = this.getAuthHeaders();
    return this.http.post<Usuario>(this.apiUrl, usuario, { headers }).pipe(
      tap({
        next: (response) => {
          console.log('✅ USUÁRIO CRIADO COM SUCESSO!');
          console.log('Resposta:', response);
        },
        error: (error) => {
          console.error('❌ Erro:', error);
        }
      })
    );
  }

  /**
   * Lista todos os usuários (apenas ADMIN)
   */
  /*
  listarUsuarios(): Observable<Usuario[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Usuario[]>(this.apiUrl, { headers });
  }
  */

  /**
   * Busca um usuário específico por ID
   */
  /*
  buscarUsuarioPorId(id: string): Observable<Usuario> {
    const headers = this.getAuthHeaders();
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`, { headers });
  }
  */

  /**
   * Atualiza um usuário
   */
  /*
  atualizarUsuario(id: string, dados: Partial<NovoUsuario>): Observable<Usuario> {
    const headers = this.getAuthHeaders();
    return this.http.put<Usuario>(`${this.apiUrl}/${id}`, dados, { headers });
  }
  */

  /**
   * Remove um usuário
   */
  /*
  removerUsuario(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/${id}`, { headers });
  }
  */

  /**
   * Helper para obter headers de autenticação
   */
  private getAuthHeaders(): { [header: string]: string } {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
}