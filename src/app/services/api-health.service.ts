import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiHealthService {
  private healthUrl = '/api/auth/health';
  
  private isApiHealthySubject = new BehaviorSubject<boolean>(true);
  public isApiHealthy$ = this.isApiHealthySubject.asObservable();
  
  private lastError: string = '';
  private hasCheckedInitially = false;

  constructor(private http: HttpClient) {}

  checkHealth(): Observable<any> {
    return this.http.get(this.healthUrl, { responseType: 'text' }).pipe(
      tap(() => {
        this.isApiHealthySubject.next(true);
        this.lastError = '';
        this.hasCheckedInitially = true;
      }),
      catchError(error => {
        this.isApiHealthySubject.next(false);
        this.lastError = this.getErrorMessage(error);
        this.hasCheckedInitially = true;
        throw error;
      })
    );
  }

  initializeHealthCheck(): void {
    if (!this.hasCheckedInitially) {
      this.checkHealth().subscribe();
    }
  }

  private getErrorMessage(error: any): string {
    if (error.status === 0) {
      return 'Erro de conexão - não foi possível contactar o servidor';
    } else if (error.status === 500) {
      return 'Erro interno do servidor - tente novamente mais tarde';
    } else if (error.status === 503) {
      return 'Serviço indisponível - em manutenção';
    } else {
      return `Erro ${error.status} - serviço temporariamente indisponível`;
    }
  }

  getLastError(): string {
    return this.lastError;
  }

  getCurrentStatus(): boolean {
    return this.isApiHealthySubject.value;
  }
}