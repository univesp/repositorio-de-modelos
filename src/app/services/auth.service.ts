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

// Interface para resposta do upload/delete de imagem
export interface ImageResponse {
  _id: string;
  imagemFileId: string | null;
  imagemUrl: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/auth/login';
  private userApiUrl = '/api/usuarios/me';

  // SUBJECT para gerenciar o estado do usuário
  private userProfileSubject = new BehaviorSubject<UserProfile | null>(null);
  public userProfile$ = this.userProfileSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.isSignedIn());

  constructor(
    private http: HttpClient, 
    private router: Router, 
    private snackBar: MatSnackBar
    ) {}

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

         // CORREÇÃO: Carrega o perfil automaticamente após login
       // console.log('🔐 Login bem-sucedido, carregando perfil...');
        this.getUserProfile().subscribe(); // Dispara o carregamento do perfil
        })
      );
  }

  // Buscar dados completos do usuário E atualizar o subject
  getUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.userApiUrl).pipe(
      tap(profile => {
        this.userProfileSubject.next(profile);
      })
    );
  }

  // Buscar imagem como blob
  getProfileImage(mongoId: string): Observable<Blob> {
   // console.log('🖼️ Buscando imagem do perfil para:', mongoId);
    return this.http.get(`/api/usuarios/${mongoId}/imagem`, { responseType: 'blob' });
  }

  // Obter perfil atual (sync)
  getCurrentUserProfile(): UserProfile | null {
    return this.userProfileSubject.value;
  }

  // Upload de imagem de perfil do usuário + atualização automática
  uploadProfileImage(mongoId: string, imageFile: File): Observable<ImageResponse> {
    const formData = new FormData();
    formData.append('file', imageFile);

   // console.log('📤 Upload de imagem para usuário:', mongoId);
    
    return this.http.put<ImageResponse>(`/api/usuarios/${mongoId}/imagem`, formData).pipe(
      tap(response => {
        // Atualiza automaticamente o perfil local
        this.updateUserProfile({
          imagemFileId: response.imagemFileId,
          imagemUrl: response.imagemUrl
        });
      })
    );
  }

  // Atualiza dados locais do usuário (após upload/delete)
  updateUserProfile(updatedProfile: Partial<UserProfile>): void {
    const currentProfile = this.userProfileSubject.value;
    
    if (currentProfile) {
      const newProfile = {
        ...currentProfile,
        ...updatedProfile
      };
      this.userProfileSubject.next(newProfile);
     // console.log('🔄 Perfil atualizado localmente:', updatedProfile);
    }
  }

  // Remover imagem de perfil do usuário + atualização automática
  removeProfileImage(mongoId: string): Observable<ImageResponse> {
   // console.log('🗑️ Removendo imagem do usuário:', mongoId);
    
    return this.http.delete<ImageResponse>(`/api/usuarios/${mongoId}/imagem`).pipe(
      tap(response => {
        // Atualiza automaticamente o perfil local
        this.updateUserProfile({
          imagemFileId: null,
          imagemUrl: null
        });
      })
    );
  }

  // MÉTODOS DE AUTENTICAÇÃO
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