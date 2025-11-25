import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ApiHealthService } from '../services/api-health.service';
import { AuthService } from '../services/auth.service'; 
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const apiHealthInterceptor: HttpInterceptorFn = (req, next) => {
  const apiHealthService = inject(ApiHealthService);
  const authService = inject(AuthService); // INJETAR AuthService

  console.log('🔍 Health Interceptor - Iniciando:', {
    url: req.url,
    tokenExpirado: authService.isTokenExpired(),
    isHealthCheck: req.url.includes('/auth/health')
  });

  // PULAR COMPLETAMENTE SE TOKEN ESTIVER EXPIRADO
  if (authService.isTokenExpired()) {
    console.log('🚫 Health Interceptor: Ignorado - token expirado');
    return next(req);
  }

  // EVITA BLOQUEAR REQUISIÇÕES - só monitora
  return next(req).pipe(
    catchError(error => {
      console.log('🔍 Health Interceptor - Erro capturado:', {
        status: error.status,
        url: req.url,
        tokenExpirado: authService.isTokenExpired()
      });

      // CRITÉRIOS MAIS RESTRITIVOS PARA EVITAR FALSOS POSITIVOS
      if (error.status !== 401 && 
          !req.url.includes('/auth/health') &&
          !authService.isTokenExpired()) {
        console.log('🔄 Health Interceptor: Verificando saúde da API');
        apiHealthService.checkHealth().subscribe();
      } else {
        console.log('🚫 Health Interceptor: Erro ignorado', {
          motivo: error.status === 401 ? '401 Unauthorized' : 
                 req.url.includes('/auth/health') ? 'Health check' : 
                 'Token expirado'
        });
      }
      
      return throwError(() => error);
    })
  );
};