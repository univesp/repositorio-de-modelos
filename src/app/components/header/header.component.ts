import { Component, OnInit } from '@angular/core';
import { ModoExplorarService } from '../../services/modo-explorar.service';
import { combineLatest } from 'rxjs';
import { NavigationEnd, Router, Event as RouterEvent } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service'; 

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {

  breadcrumbs: string[] = ['Home'];
  // Variável para armazenar a URL da última página de listagem visitada
  private lastListPageUrl: string | null = null;

  isLoggedIn: boolean = false;
  userName: string = '';
  userInitial: string = '';

  constructor(
    private modoExplorarService: ModoExplorarService,
    private router: Router,
    private authService: AuthService
  ){}

  ngOnInit(): void {
    // Verifica o estado de autenticação
    this.checkAuthStatus();

    // Observa mudanças no estado de autenticação
    this.authService.isAuthenticated().subscribe(isAuthenticated => {
      this.isLoggedIn = isAuthenticated;
      this.updateUserInfo();
    });

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
      // Adicionado: Lógica para a página de cadastro
      else if (url.startsWith('/cadastro-novo-modelo')) {
        this.modoExplorarService.setModoExplorarAtivo(false); // Cadastro não é 'explorar'
        this.modoExplorarService.setModeloId(null);
        this.modoExplorarService.setFiltrosAtuais({});
        this.lastListPageUrl = url; // Considera como uma "página de listagem" para o propósito de breadcrumb
      }
      // Lógica para a página de perfil
      else if (url.startsWith('/perfil')) {
        this.modoExplorarService.setModoExplorarAtivo(false);
        this.modoExplorarService.setModeloId(null);
        this.modoExplorarService.setFiltrosAtuais({});
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

      // Extrai o ID do modelo da URL, se for uma página de modelo (ex: /modelo/123)
      const idFromUrlMatch = currentUrl.match(/\/modelo\/(\d+)/);
      const idFromUrl = idFromUrlMatch ? parseInt(idFromUrlMatch[1], 10) : null;

      if (idFromUrl !== null) { // Estamos em uma página de detalhes do modelo (ex: /modelo/123)
        // Usa a última URL de listagem capturada para decidir o breadcrumb "pai"
        if (this.lastListPageUrl?.startsWith('/resultados')) {
          crumbs.push('Resultados');
        } else if (this.lastListPageUrl?.startsWith('/explorar')) {
          crumbs.push('Explorar');
        }
        // Adicionado: Se a página anterior foi a de cadastro, adiciona o breadcrumb
        else if (this.lastListPageUrl?.startsWith('/cadastro-novo-modelo')) {
          crumbs.push('Cadastro de Modelo');
        }
        crumbs.push(`Modelo #${idFromUrl}`); // Usa o ID extraído da URL para o breadcrumb do modelo
      } else { // Estamos em uma página de listagem, Home ou cadastro
        if (currentUrl.startsWith('/resultados')) {
          crumbs.push('Resultados');
          // Garante que a URL da lista é capturada caso o usuário acesse diretamente a URL
          this.lastListPageUrl = currentUrl;
        } else if (currentUrl.startsWith('/explorar')) {
          crumbs.push('Explorar');
          // Garante que a URL da lista é capturada caso o usuário acesse diretamente a URL
          this.lastListPageUrl = currentUrl;
        }
        // Adicionado: Lógica para a página de cadastro
        else if (currentUrl.startsWith('/cadastro-novo-modelo')) {
          crumbs.push('Cadastro de Modelo');
        }
        else if (currentUrl.startsWith('/perfil')) {
          crumbs.push('Perfil');
        }
        // Se currentUrl é apenas '/', os crumbs permanecem ['Home'],
        // e lastListPageUrl já é null (definido acima).
      }

      this.breadcrumbs = crumbs;
    });
  }

  // Método para verificar o status de autenticação
  private checkAuthStatus(): void {
    this.isLoggedIn = this.authService.isSignedIn();
    this.updateUserInfo();
  }

  // Método para atualizar informações do usuário
  private updateUserInfo(): void {
    if(this.isLoggedIn) {
      const userData = this.authService.getAuthData();
      if(userData) {
        this.userName = userData.nome;

        // Pega a primeira letra do nome para o avatar
        this.userInitial = this.userName.charAt(0).toUpperCase();
      }
    } else {
      this.userName = '';
      this.userInitial = '';
    }
  }

  // Método para navegar para o Login
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  // Método para navegar para página do usuário
  goToUserProfile(): void {
    this.router.navigate(['/perfil']);
  }

  // Método para fazer logout
  logout(): void {
    this.authService.logout();
    this.isLoggedIn = false;
    this.userName = '';
    this.userInitial = '';
    this.router.navigate(['/']);
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
