import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('Interceptor: Verificando token para', req.url);
  
  // VERIFICA SE TOKEN ESTÁ EXPIRADO (apenas aviso, não bloqueia)
  if (authService.isSignedIn() && authService.isTokenExpired()) {
    authService.showTokenExpiredWarning();
  }

  // PROSSEGUE COM A REQUISIÇÃO (mesmo com token expirado)
  return next(req).pipe(
    catchError((error) => {
      console.log('❌ Interceptor: Erro na requisição', error.status);
      
      // IGNORA ERRO 404 (NÃO É ERRO DE AUTENTICAÇÃO)
      if (error.status === 404) {
        console.log('📭 Interceptor: Ignorando erro 404 (recurso não encontrado)');
        return throwError(() => error);
      }
      
      // SE A API REJEITOU COM 401, AÍ SIM DESLOGA
      if (error.status === 401) {
        console.log('🔐 Interceptor: API rejeitou token (401), tratando expiração...');
        authService.handleTokenExpired();
      }
      
      return throwError(() => error);
    })
  );
};