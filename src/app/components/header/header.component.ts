import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModoExplorarService } from '../../services/modo-explorar.service';
import { combineLatest, Subject } from 'rxjs';
import { NavigationEnd, Router, Event as RouterEvent } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { AuthService, UserProfile } from '../../services/auth.service'; 
import { ImageService } from '../../services/image.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {

  breadcrumbs: string[] = ['Home'];
  private lastListPageUrl: string | null = null;

  isLoggedIn: boolean = false;
  userName: string = '';
  userInitial: string = '';
  
  userProfile: UserProfile | null = null;
  imageBlobUrl: SafeUrl | null = null;

  isImageLoading: boolean = false;
  hasImageError: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private modoExplorarService: ModoExplorarService,
    private router: Router,
    private authService: AuthService,
    private imageService: ImageService,
    private sanitizer: DomSanitizer,
    private http: HttpClient
  ){}

  ngOnInit(): void {
    this.checkAuthStatus();

    // CORREÇÃO: Usa takeUntil para todas as subscriptions
    this.authService.isAuthenticated()
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuthenticated => {
        //console.log('🔐 Header: Status autenticação ->', isAuthenticated);
        this.isLoggedIn = isAuthenticated;
        
        if (isAuthenticated) {
          this.authService.getUserProfile().subscribe();
        } else {
          this.resetUserInfo();
        }
      });

    this.authService.userProfile$
      .pipe(takeUntil(this.destroy$))
      .subscribe(profile => {
        //console.log('👤 Header: Perfil atualizado ->', profile ? 'Com perfil' : 'Sem perfil');
        
        if (profile) {
          this.userProfile = profile;
          this.userName = this.getUserName(profile);
          this.userInitial = this.getUserInitial(profile);
          this.loadProfileImage();
        } else {
          this.resetUserInfo();
        }
      });

    // Router events com takeUntil
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects;
        
        if (url === '/') {
          this.modoExplorarService.setModoExplorarAtivo(false);
          this.modoExplorarService.setModeloId(null);
          this.modoExplorarService.setFiltrosAtuais({});
          this.lastListPageUrl = null;
        } else if (url.startsWith('/resultados')) {
          this.modoExplorarService.setModoExplorarAtivo(true);
          this.modoExplorarService.setModeloId(null);
          this.lastListPageUrl = url;
        } else if (url.startsWith('/explorar')) {
          this.modoExplorarService.setModoExplorarAtivo(true);
          this.modoExplorarService.setModeloId(null);
          this.modoExplorarService.setFiltrosAtuais({});
          this.lastListPageUrl = url;
        } else if (url.startsWith('/cadastro-novo-modelo')) {
          this.modoExplorarService.setModoExplorarAtivo(false);
          this.modoExplorarService.setModeloId(null);
          this.modoExplorarService.setFiltrosAtuais({});
          this.lastListPageUrl = url;
        } else if (url.startsWith('/perfil')) {
          this.modoExplorarService.setModoExplorarAtivo(false);
          this.modoExplorarService.setModeloId(null);
          this.modoExplorarService.setFiltrosAtuais({});
        } else if (url.startsWith('/tags')) {
          this.modoExplorarService.setModoExplorarAtivo(false);
          this.modoExplorarService.setModeloId(null);
          this.modoExplorarService.setFiltrosAtuais({});
        } else {
          this.modoExplorarService.setModoExplorarAtivo(false);
        }   
        
      });

    // Breadcrumbs com takeUntil
    combineLatest([
      this.modoExplorarService.modoExplorarAtivo$,
      this.modoExplorarService.modeloId$,
      this.router.events.pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd)
      )
    ])
    .pipe(takeUntil(this.destroy$))
    .subscribe(([explorarAtivo, modeloId, navEvent]) => {
      const crumbs = ['Home'];
      const currentUrl = navEvent.urlAfterRedirects;

      const idFromUrlMatch = currentUrl.match(/\/modelo\/(\d+)/);
      const idFromUrl = idFromUrlMatch ? parseInt(idFromUrlMatch[1], 10) : null;

      if (idFromUrl !== null) {
        if (this.lastListPageUrl?.startsWith('/resultados')) {
          crumbs.push('Resultados');
        } else if (this.lastListPageUrl?.startsWith('/explorar')) {
          crumbs.push('Explorar');
        } else if (this.lastListPageUrl?.startsWith('/cadastro-novo-modelo')) {
          crumbs.push('Cadastro de Modelo');
        }
        crumbs.push(`Modelo #${idFromUrl}`);
      } else {
        if (currentUrl.startsWith('/resultados')) {
          crumbs.push('Resultados');
          this.lastListPageUrl = currentUrl;
        } else if (currentUrl.startsWith('/explorar')) {
          crumbs.push('Explorar');
          this.lastListPageUrl = currentUrl;
        } else if (currentUrl.startsWith('/cadastro-novo-modelo')) {
          crumbs.push('Cadastro de Modelo');
        } else if (currentUrl.startsWith('/perfil')) {
          crumbs.push('Perfil');
        } else if (currentUrl.startsWith('/tags')) {
          crumbs.push('Tags');
        }
      }

      this.breadcrumbs = crumbs;
    });
  }

  ngOnDestroy(): void {
    // CORREÇÃO: Limpa todas as subscriptions de uma vez
    this.destroy$.next();
    this.destroy$.complete();
  }

   // Método para obter o nome completo
   private getUserName(profile: UserProfile): string {
    // Se tiver nome, usa nome, senão usa firstname + lastname
    if (profile.nome && profile.nome.trim() !== '') {
      return profile.nome;
    } else if (profile.firstname && profile.lastname) {
      return `${profile.firstname} ${profile.lastname}`;
    } else if (profile.firstname) {
      return profile.firstname;
    } else {
      // Fallback: usa o email sem o domínio
      return profile.email.split('@')[0];
    }
  }

  // Método para obter a inicial
  private getUserInitial(profile: UserProfile): string {
    // Se tiver nome, usa a primeira letra do nome
    if (profile.nome && profile.nome.trim() !== '') {
      return profile.nome.charAt(0).toUpperCase();
    } 
    // Se tiver firstname, usa a primeira letra do firstname
    else if (profile.firstname) {
      return profile.firstname.charAt(0).toUpperCase();
    } 
    // Fallback: usa a primeira letra do email
    else {
      return profile.email.charAt(0).toUpperCase();
    }
  }

  private resetUserInfo(): void {
    //console.log('🧹 Header: Resetando informações do usuário');
    this.userProfile = null;
    this.userName = '';
    this.userInitial = '';
    this.imageBlobUrl = null;
    this.isImageLoading = false;
    this.hasImageError = false;
  }

  private loadProfileImage(): void {
    // Limpa subscription anterior se existir
    if (this.imageSubscription) {
      this.imageSubscription.unsubscribe();
    }

    if (this.userProfile?.mongoId && this.userHasImage()) {
      this.isImageLoading = true;
      this.hasImageError = false;
      
      // CORREÇÃO: Também usa takeUntil para a subscription da imagem
      this.imageService.getProfileImage(this.userProfile.mongoId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (secureUrl) => {
            this.imageBlobUrl = secureUrl;
            this.isImageLoading = false;
          },
          error: (error) => {
            console.error('❌ Header: Erro ao carregar imagem:', error);
            this.imageBlobUrl = null;
            this.isImageLoading = false;
            this.hasImageError = true;
          }
        });
    } else {
      this.imageBlobUrl = null;
      this.isImageLoading = false;
      this.hasImageError = false;
    }
  }

  private userHasImage(): boolean {
    if (!this.userProfile) return false;
    return !!(this.userProfile.imagemFileId || this.userProfile.imagemUrl);
  }

  private checkAuthStatus(): void {
    this.isLoggedIn = this.authService.isSignedIn();
    //console.log('🔍 Header: Status inicial ->', this.isLoggedIn);
    this.updateUserInfo();
  }

  private updateUserInfo(): void {
    if (this.isLoggedIn) {
      //console.log('🔄 Header: Atualizando informações do usuário logado');
      const currentProfile = this.authService.getCurrentUserProfile();
      
      if (currentProfile) {
        this.userProfile = currentProfile;
        this.userName = currentProfile.nome;
        this.userInitial = currentProfile.nome.charAt(0).toUpperCase();
        this.loadProfileImage();
      } else {
        this.authService.getUserProfile().subscribe();
      }
    } else {
      this.resetUserInfo();
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToUserProfile(): void {
    this.router.navigate(['/perfil']);
  }

  logout(): void {
   // console.log('🚪 Header: Iniciando logout...');
    this.authService.logout();
    this.router.navigate(['/']);
  }

  isnoBreadCrumbsPath(): boolean {
    const noBreadCrumbsPath = ['/login', '/404'];
    return noBreadCrumbsPath.some(path => this.router.url.startsWith(path));
  }

  onClickHome() {
    // CORREÇÃO: Não precisa mais desinscrever manualmente - o takeUntil cuida disso
    this.modoExplorarService.resetAll();
    this.lastListPageUrl = null;
    
    this.router.navigate(['/'], {
      replaceUrl: true,
      queryParams: {},
      queryParamsHandling: ''
    });
  }

  // CORREÇÃO: Adiciona a propriedade imageSubscription que estava faltando
  private imageSubscription: any;


  // header.component.ts - ADICIONE TEMPORARIAMENTE
  /*
testTokenExpired(): void {
  this.authService.showTokenExpiredWarning();
}

testApiError(): void {
  // Simula uma requisição que retorna 401
  this.http.get('/api/test-401').subscribe({
    error: (error) => {
      console.log('Erro simulado:', error);
    }
  });
}
*/
}