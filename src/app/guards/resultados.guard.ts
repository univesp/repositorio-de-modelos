import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class ResultadosGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Verifica se existem parâmetros de query
    const hasQueryParams = Object.keys(route.queryParams).length > 0;
    
    if (!hasQueryParams) {
      this.router.navigate(['/404'], { 
        skipLocationChange: true // Opcional: não aparece no histórico de navegação
      });
      return false;
    }
    return true;
  }
}