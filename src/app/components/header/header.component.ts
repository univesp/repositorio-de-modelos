import { Component, OnInit } from '@angular/core';
import { ModoExplorarService } from '../../services/modo-explorar.service';
import { combineLatest } from 'rxjs';
import { NavigationEnd, Router, Event as RouterEvent } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {

  breadcrumbs: string[] = ['Home'];
  // Variável para armazenar a URL da última página de listagem visitada
  private lastListPageUrl: string | null = null;

  constructor(
    private modoExplorarService: ModoExplorarService,
    private router: Router
  ){}

  ngOnInit(): void {
    // Atualiza o estado global e captura a URL da última página de listagem
    this.router.events
    .pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    )
    .subscribe((event: NavigationEnd) => {
      const url = event.urlAfterRedirects;

      if (url === '/') {
        this.modoExplorarService.setModoExplorarAtivo(false);
        this.modoExplorarService.setModeloId(null);
        this.modoExplorarService.setFiltrosAtuais({});
        this.lastListPageUrl = null; // Limpa a URL da última lista se for para a Home
      } else if (url.startsWith('/resultados')) {
        this.modoExplorarService.setModoExplorarAtivo(true);
        this.modoExplorarService.setModeloId(null);
        // Captura a URL da página de Resultados
        this.lastListPageUrl = url;
      } else if (url.startsWith('/explorar')) {
        this.modoExplorarService.setModoExplorarAtivo(true);
        this.modoExplorarService.setModeloId(null);
        this.modoExplorarService.setFiltrosAtuais({});
        // Captura a URL da página de Explorar
        this.lastListPageUrl = url;
      }
       else {
        this.modoExplorarService.setModoExplorarAtivo(false);
        // Não limpa lastListPageUrl aqui, pois podemos ter navegado para uma página de modelo
        // e precisamos saber de onde viemos.
      }
    });

    // Lógica para gerar os breadcrumbs
    combineLatest([
      this.modoExplorarService.modoExplorarAtivo$,
      this.modoExplorarService.modeloId$,
      this.router.events.pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd)
      )
    ]).subscribe(([explorarAtivo, modeloId, navEvent]) => {
      const crumbs = ['Home'];
      const currentUrl = navEvent.urlAfterRedirects;

      if (modeloId !== null) { // Estamos em uma página de detalhes do modelo (ex: /modelo/123)
        // Usa a última URL de listagem capturada para decidir o breadcrumb "pai"
        if (this.lastListPageUrl?.startsWith('/resultados')) {
          crumbs.push('Resultados');
        } else if (this.lastListPageUrl?.startsWith('/explorar')) {
          crumbs.push('Explorar');
        }
        crumbs.push(`Modelo #${modeloId}`);
      } else { // Estamos em uma página de listagem ou Home
        if (currentUrl.startsWith('/resultados')) {
          crumbs.push('Resultados');
          // Garante que a URL da lista é capturada caso o usuário acesse diretamente a URL
          this.lastListPageUrl = currentUrl;
        } else if (currentUrl.startsWith('/explorar')) {
          crumbs.push('Explorar');
          // Garante que a URL da lista é capturada caso o usuário acesse diretamente a URL
          this.lastListPageUrl = currentUrl;
        }
        // Se currentUrl é apenas '/', os crumbs permanecem ['Home'],
        // e lastListPageUrl já é null (definido acima).
      }

      this.breadcrumbs = crumbs;
    });
  }

  isnoBreadCrumbsPath(): boolean {
    const noBreadCrumbsPath = ['/login', '/404'];
    return noBreadCrumbsPath.some(path => this.router.url.startsWith(path));
  }

  onClickHome() {
    this.router.navigate(['/'], {
      replaceUrl: true,
      queryParams: {},
      queryParamsHandling: ''
    }).then(() => {
      // window.location.reload(); // Manter comentado
    });
  }
}
