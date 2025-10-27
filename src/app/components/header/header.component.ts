// header.component.ts - VERSÃO CORRIGIDA
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModoExplorarService } from '../../services/modo-explorar.service';
import { combineLatest, Subscription } from 'rxjs';
import { NavigationEnd, Router, Event as RouterEvent } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService, UserProfile } from '../../services/auth.service'; 
import { ImageService } from '../../services/image.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

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
  private userProfileSubscription: Subscription | null = null;
  private imageSubscription: Subscription | null = null;
  private authSubscription: Subscription | null = null;

  isImageLoading: boolean = false;
  hasImageError: boolean = false;

  constructor(
    private modoExplorarService: ModoExplorarService,
    private router: Router,
    private authService: AuthService,
    private imageService: ImageService,
    private sanitizer: DomSanitizer
  ){}

  ngOnInit(): void {
    this.checkAuthStatus();

    // CORREÇÃO: Observa mudanças de autenticação E carrega a imagem quando loga
    this.authSubscription = this.authService.isAuthenticated().subscribe(isAuthenticated => {
      this.isLoggedIn = isAuthenticated;
      this.updateUserInfo();
      
      // CORREÇÃO IMPORTANTE: Se acabou de logar, força o carregamento da imagem
      if (isAuthenticated && this.userProfile) {
        //console.log('🔐 Login detectado, carregando imagem...');
        this.loadProfileImage();
      }
    });

    // Observa mudanças no perfil do usuário
    this.userProfileSubscription = this.authService.userProfile$.subscribe(profile => {
      this.userProfile = profile;
      if (profile) {
        this.userName = profile.nome;
        this.userInitial = profile.nome.charAt(0).toUpperCase();
        
        // CORREÇÃO: Sempre carrega a imagem quando o perfil é atualizado
       // console.log('🔄 Perfil atualizado no header, carregando imagem...');
        this.loadProfileImage();
      } else {
        this.userName = '';
        this.userInitial = '';
        this.imageBlobUrl = null;
      }
    });

    // Resto do código permanece igual...
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
      }
      else if (url.startsWith('/cadastro-novo-modelo')) {
        this.modoExplorarService.setModoExplorarAtivo(false);
        this.modoExplorarService.setModeloId(null);
        this.modoExplorarService.setFiltrosAtuais({});
        this.lastListPageUrl = url;
      }
      else if (url.startsWith('/perfil')) {
        this.modoExplorarService.setModoExplorarAtivo(false);
        this.modoExplorarService.setModeloId(null);
        this.modoExplorarService.setFiltrosAtuais({});
      }
      else {
        this.modoExplorarService.setModoExplorarAtivo(false);
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

      const idFromUrlMatch = currentUrl.match(/\/modelo\/(\d+)/);
      const idFromUrl = idFromUrlMatch ? parseInt(idFromUrlMatch[1], 10) : null;

      if (idFromUrl !== null) {
        if (this.lastListPageUrl?.startsWith('/resultados')) {
          crumbs.push('Resultados');
        } else if (this.lastListPageUrl?.startsWith('/explorar')) {
          crumbs.push('Explorar');
        }
        else if (this.lastListPageUrl?.startsWith('/cadastro-novo-modelo')) {
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
        }
        else if (currentUrl.startsWith('/cadastro-novo-modelo')) {
          crumbs.push('Cadastro de Modelo');
        }
        else if (currentUrl.startsWith('/perfil')) {
          crumbs.push('Perfil');
        }
      }

      this.breadcrumbs = crumbs;
    });
  }

  ngOnDestroy(): void {
    // Limpa todas as subscriptions
    if (this.userProfileSubscription) {
      this.userProfileSubscription.unsubscribe();
    }
    if (this.imageSubscription) {
      this.imageSubscription.unsubscribe();
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  private loadProfileImage(): void {
    // Limpa subscription anterior
    if (this.imageSubscription) {
      this.imageSubscription.unsubscribe();
    }

    if (this.userProfile?.mongoId && this.userHasImage()) {
     // console.log('🖼️ Header: Carregando imagem para:', this.userProfile.mongoId);

       // Inicia loading
       this.isImageLoading = true;
       this.hasImageError = false;
      
      this.imageSubscription = this.imageService.getProfileImage(this.userProfile.mongoId).subscribe({
        next: (secureUrl) => {
          this.imageBlobUrl = secureUrl;
          this.isImageLoading = false;
        //  console.log('✅ Header: Imagem carregada com sucesso');
        },
        error: (error) => {
          console.error('❌ Header: Erro ao carregar imagem:', error);
          this.imageBlobUrl = null;
          this.isImageLoading = false;
          this.hasImageError = true;
          
          // Se for 404, o usuário realmente não tem imagem
          if (error.status === 404) {
           // console.log('ℹ️ Header: Usuário não tem imagem (404)');
          }
        }
      });
    } else {
      this.imageBlobUrl = null;
      this.isImageLoading = false;
      this.hasImageError = false;
     // console.log('ℹ️ Header: Usuário não tem imagem ou mongoId não disponível');
    }
  }

  private userHasImage(): boolean {
    if (!this.userProfile) return false;
    return !!(this.userProfile.imagemFileId || this.userProfile.imagemUrl);
  }

  private checkAuthStatus(): void {
    this.isLoggedIn = this.authService.isSignedIn();
    this.updateUserInfo();
  }

  // MÉTODO ATUALIZADO: Mais inteligente
  private updateUserInfo(): void {
    if(this.isLoggedIn) {
      // Se já temos um perfil (via userProfile$), não precisa buscar de novo
      const currentProfile = this.authService.getCurrentUserProfile();
      
      if (currentProfile) {
        // Já temos o perfil em cache, usa ele
        this.userProfile = currentProfile;
        this.userName = currentProfile.nome;
        this.userInitial = currentProfile.nome.charAt(0).toUpperCase();
        
        // CORREÇÃO: Carrega a imagem imediatamente
       // console.log('👤 Header: Perfil em cache, carregando imagem...');
        this.loadProfileImage();
      } else {
        // Precisa buscar o perfil
        this.authService.getUserProfile().subscribe({
          next: (profile) => {
            // O userProfile$ vai ser atualizado automaticamente pelo AuthService
            // que por sua vez vai disparar loadProfileImage()
          },
          error: () => {
            this.userName = 'Usuário';
            this.userInitial = 'U';
            this.imageBlobUrl = null;
          }
        });
      }
    } else {
      this.userName = '';
      this.userInitial = '';
      this.imageBlobUrl = null;
      this.userProfile = null;
    }
  }

  // Métodos existentes permanecem iguais...
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToUserProfile(): void {
    this.router.navigate(['/perfil']);
  }

  logout(): void {
    this.authService.logout();
    this.isLoggedIn = false;
    this.userName = '';
    this.userInitial = '';
    this.imageBlobUrl = null;
    this.userProfile = null;
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
    });
  }
}