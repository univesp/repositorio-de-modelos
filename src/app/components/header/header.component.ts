import { Component, OnInit } from '@angular/core';
import { ModoExplorarService } from '../../services/modo-explorar.service';
import { combineLatest } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

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
    // Atualiza o estado global com base na rota atual
    this.router.events
    .pipe(filter(event => event instanceof NavigationEnd))
    .subscribe(() => {
      const url = this.router.url;

      if (url === '/') {
        this.modoExplorarService.setModoExplorarAtivo(false);
        this.modoExplorarService.setModeloId(null);
        this.modoExplorarService.setFiltrosAtuais({});
      } else if (url.startsWith('/resultados')) {
        this.modoExplorarService.setModoExplorarAtivo(true);
        this.modoExplorarService.setModeloId(null);
      } else {
        // Qualquer outra rota que não deve ativar explorar
        this.modoExplorarService.setModoExplorarAtivo(false);
      }
      
    });

    combineLatest([
      this.modoExplorarService.modoExplorarAtivo$,
      this.modoExplorarService.modeloId$,
      this.router.events.pipe(filter(event => event instanceof NavigationEnd))
    ]).subscribe(([explorarAtivo, modeloId, navEvent]) => {
      const crumbs = ['Home'];

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
    // Limpa TUDO antes de navegar (incluindo queryParams)
    this.router.navigate(['/'], {
      replaceUrl: true,          // Substitui a URL no histórico
      queryParams: {},           // Garante que não há params residuais
      queryParamsHandling: ''    // Ignora qualquer parâmetro existente
    }).then(() => {
      window.location.reload();  // 🔄 Força recarregar a página (opcional, teste sem isso primeiro)
    });
  }
  
  
}
