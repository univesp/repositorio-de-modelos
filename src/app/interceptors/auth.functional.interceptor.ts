// auth.functional.interceptor.ts - VERSÃO CORRIGIDA
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authFunctionalInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  const authData = authService.getAuthData();
  
  //console.log('🔄 Interceptor executado para:', req.url);
  //console.log('📦 Token existe:', !!authData?.token);
  //console.log('📝 Method:', req.method);
  //console.log('🔤 Content-Type:', req.headers.get('Content-Type'));
  
  if (authData && authData.token) {
    // CLONE CORRETO - mantém os headers existentes e adiciona Authorization
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `${authData.type} ${authData.token}`)
    });
    
   // console.log('🔐 Header Authorization adicionado');
   // console.log('📋 Headers finais:', authReq.headers.keys());
    return next(authReq);
  }

  //console.log('⚠️ Sem token, requisição sem header Authorization');
  return next(req);
};