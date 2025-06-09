import { Component, OnInit } from '@angular/core';
import { ModoExplorarService } from '../../services/modo-explorar.service';
import { combineLatest } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {

  breadcrumbs: string[] = ['Home'];

  constructor(
    private modoExplorarService: ModoExplorarService,
    private router: Router
  ){}

  ngOnInit(): void {
    combineLatest([
      this.modoExplorarService.modoExplorarAtivo$,
      this.modoExplorarService.modeloId$
    ]).subscribe(([explorarAtivo, modeloId]) => {
      const crumbs = ['Home'];
      const url = this.router.url;

      if (modeloId !== null) {
        if (explorarAtivo) {
          // Caso: Home > Resultados > Modelo #id
          crumbs.push('Resultados');
          crumbs.push(`Modelo #${modeloId}`);
        } else {
          // Caso: Home > Modelo #id
          crumbs.push(`Modelo #${modeloId}`);
        }
      } else {
        if (explorarAtivo) {
          // Caso: Home > Resultados
          crumbs.push('Resultados');
        }
        // Caso padrão: só Home
      }

      this.breadcrumbs = crumbs;
    });
  }

  isnoBreadCrumbsPath(): boolean {
    const noBreadCrumbsPath = ['/login', '/404'];
    return noBreadCrumbsPath.some(path => this.router.url.startsWith(path));
  }

  onClickHome() {
    // 1. Resetar todos os estados
    this.modoExplorarService.setModoExplorarAtivo(false);
    this.modoExplorarService.setModeloId(null);
    this.modoExplorarService.setFiltrosAtuais({});
  
    // 2. Navegação otimizada
    if (this.router.url === '/') {
      // Se já está na home, força recarregamento
      window.location.reload();
    } else {
      // Se está em outra rota, navega normalmente
      this.router.navigate(['/']);
    }
  }

  
}
