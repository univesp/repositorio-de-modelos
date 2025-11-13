import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ApiHealthService } from '../services/api-health.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const apiHealthInterceptor: HttpInterceptorFn = (req, next) => {
  const apiHealthService = inject(ApiHealthService);
  
  // EVITA BLOQUEAR REQUISIÇÕES - só monitora
  return next(req).pipe(
    catchError(error => {
      // Se qualquer requisição falhar (exceto 401 e health), verifica saúde
      if (error.status !== 401 && !req.url.includes('/auth/health')) {
        console.log('🔍 Requisição falhou, verificando saúde da API...');
        apiHealthService.checkHealth().subscribe();
      }
      return throwError(() => error);
    })
  );
};