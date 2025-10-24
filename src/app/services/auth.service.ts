import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface LoginRequest {
  email: string;
  password: string;
}

// O que a API RETORNA no login (todos os dados)
export interface LoginApiResponse {
  type: string;
  token: string;
  email: string;
  id: number;
  mongoId: string;
  firstname: string;
  lastname: string;
  nome: string;
  imagemFileId: string | null;
  imagemUrl: string | null;
  instituicao: string;
  cargo: string;
  salvos: string[];
}

// O que NÓS SALVAMOS no localStorage (apenas token e type)
export interface LoginResponse {
  type: string;
  token: string;
}

// Interface para dados completos do usuário (endpoint separado)
export interface UserProfile {
  mongoId: string;
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  nome: string;
  imagemFileId: string | null;
  imagemUrl: string | null;
  instituicao: string;
  cargo: string;
  salvos: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/auth/login';
  private userApiUrl = '/api/usuarios/me';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.isSignedIn());

  constructor(private http: HttpClient, private router: Router, private snackBar: MatSnackBar) {
    //console.log('AuthService iniciado com URL:', this.apiUrl);
  }

  login(credentials: LoginRequest): Observable<LoginApiResponse> {
   // console.log('Enviando login para:', this.apiUrl);
   // console.log('Email:', credentials.email);
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    return this.http.post<LoginApiResponse>(this.apiUrl, credentials, { headers })
      .pipe(
        tap(response => {
         // console.log('✅ Login bem-sucedido! API retornou:', response);
          
          // ABORDAGEM LIMPA: Extrai APENAS o que precisamos salvar
          const tokenData: LoginResponse = {
            type: response.type,
            token: response.token
          };
          
          this.setAuthData(tokenData);
          this.setAuthentication(true);
         // console.log('💾 Salvo no localStorage:', tokenData);
        })
      );
  }

  // Buscar dados completos do usuário
  getUserProfile(): Observable<UserProfile> {
   // console.log('🔍 Buscando dados do usuário em:', this.userApiUrl);
    
    // O INTERCEPTOR vai adicionar o header automaticamente
    // REMOVA os headers manuais daqui
    return this.http.get<UserProfile>(this.userApiUrl);
  }

  // MÉTODOS DE AUTENTICAÇÃO (mantidos iguais)
  logout(): void {
    this.setAuthentication(false);
    localStorage.removeItem('authData');
  }

  private setAuthentication(status: boolean): void {
    localStorage.setItem('isSignedIn', status.toString());
    this.isAuthenticatedSubject.next(status);
  }

  private setAuthData(authData: LoginResponse): void {
    localStorage.setItem('authData', JSON.stringify(authData));
  }

  getAuthData(): LoginResponse | null {
    const data = localStorage.getItem('authData');
    return data ? JSON.parse(data) : null;
  }

  getToken(): string | null {
    const data = this.getAuthData();
    return data ? data.token : null;
  }

  // REMOVA ESTES MÉTODOS (não são mais necessários)
  /*
  getUserEmail(): string | null {
    return null;
  }

  getUserId(): number | null {
    return null;
  }

  getUserMongoId(): string | null {
    return null;
  }

  getUserName(): string | null {
    return null;
  }

  getUserImage(): string | null {
    return null;
  }
  */

  isSignedIn(): boolean {
    const signedIn = localStorage.getItem('isSignedIn');
    const token = this.getToken();
    return signedIn === 'true' && !!token;
  }

  isAuthenticated(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  getAuthStatus(): boolean {
    return this.isAuthenticatedSubject.value;
  }
}