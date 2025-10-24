// src/app/interceptors/auth.functional.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authFunctionalInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  const authData = authService.getAuthData();
  
  //console.log('🔄 Functional Interceptor executado para:', req.url);
  //console.log('📦 Token existe:', !!authData?.token);
  
  if (authData && authData.token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `${authData.type} ${authData.token}`
      }
    });
   // console.log('🔐 Header Authorization adicionado');
    return next(authReq);
  }

 // console.log('⚠️ Sem token, requisição sem header Authorization');
  return next(req);
};