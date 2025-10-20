import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  type: string;
  token: string;
  email: string;
  id: number;
  mongoId: string;
  nome: string;
  imagemUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/auth/login';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.isSignedIn());

  constructor(private http: HttpClient, private router: Router, private snackBar: MatSnackBar) {
    console.log('AuthService iniciado com URL:', this.apiUrl);
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    console.log('Enviando login para:', this.apiUrl);
    console.log('Email:', credentials.email);
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    return this.http.post<LoginResponse>(this.apiUrl, credentials, { headers })
      .pipe(
        tap(response => {
          console.log('✅ Login bem-sucedido!', response);
          this.setAuthData(response);
          this.setAuthentication(true);
        })
      );
  }

  logout(): void {
    this.setAuthentication(false);
    localStorage.removeItem('authData');
    this.router.navigate(['/login']);
  }

  private setAuthentication(status: boolean): void {
    localStorage.setItem('isSignedIn', status.toString());
    this.isAuthenticatedSubject.next(status);
  }

  private setAuthData(authData: LoginResponse): void {
    localStorage.setItem('authData', JSON.stringify(authData));
    console.log('💾 Dados salvos no localStorage');
  }

  getAuthData(): LoginResponse | null {
    const data = localStorage.getItem('authData');
    return data ? JSON.parse(data) : null;
  }

  getToken(): string | null {
    const data = this.getAuthData();
    return data ? data.token : null;
  }

  getUserEmail(): string | null {
    const data = this.getAuthData();
    return data ? data.email : null;
  }

  getUserId(): number | null {
    const data = this.getAuthData();
    return data ? data.id : null;
  }

  getUserMongoId(): string | null {
    const data = this.getAuthData();
    return data ? data.mongoId : null;
  }

  getUserName(): string | null {
    const data = this.getAuthData();
    return data ? data.nome : null;
  }

  getUserImage(): string | null {
    const data = this.getAuthData();
    return data ? data.imagemUrl : null;
  }

  isSignedIn(): boolean {
    const signedIn = localStorage.getItem('isSignedIn');
    console.log('Verificando isSignedIn. Valor no localStorage:', signedIn);
    return signedIn === 'true'; // IMPORTANTE: compara com string 'true'
  }

  isAuthenticated(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  getAuthStatus(): boolean {
    return this.isAuthenticatedSubject.value;
  }
}