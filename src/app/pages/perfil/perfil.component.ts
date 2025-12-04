import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, UserProfile } from '../../services/auth.service';
import { ImageService } from '../../services/image.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit, OnDestroy {

  userData: UserProfile | null = null;
  isLoading: boolean = true;
  error: string = '';
  
  isUploading: boolean = false;
  showImageMenu: boolean = false;
  selectedFile: File | null = null;
  imageBlobUrl: SafeUrl | null = null;
  isImageLoading: boolean = false;
  hasImageError: boolean = false;
  isLoggedIn: boolean = false;

  currentView: 'favoritos' | 'criar-usuario' | 'visualizar-usuarios' = 'favoritos';

  showToggleButton = false;
  isInfoExpanded = false;
  
  private imageSubscription: Subscription | null = null;
  private userProfileSubscription: Subscription | null = null;

  constructor(
    private router: Router,
    public authService: AuthService,
    private imageService: ImageService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isSignedIn();

    this.authService.isAuthenticated().subscribe(loggedIn => {
      this.isLoggedIn = loggedIn;
    });

    if (!this.isLoggedIn) {
      this.router.navigate(['/']);
    }

    this.loadUserProfile();
    
    // OBSERVA mudanças no perfil do usuário
    this.userProfileSubscription = this.authService.userProfile$.subscribe(profile => {
      if (profile) {
        this.userData = profile;
       // console.log('🔄 Perfil atualizado via Subject');
        
        // Recarrega a imagem se necessário
        if (this.userHasImage()) {
          this.loadProfileImage();
        }
      }
    });

    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  ngOnDestroy(): void {
    this.cleanupImageResources();
    if (this.userProfileSubscription) {
      this.userProfileSubscription.unsubscribe();
    }

    window.removeEventListener('resize', () => this.checkScreenSize());
  }

  // Método para verificar tamanho da tela:
  checkScreenSize() {
    this.showToggleButton = window.innerWidth < 1200;
    
    // Em telas grandes, garantir que as infos estejam visíveis
    if (!this.showToggleButton) {
      this.isInfoExpanded = true;
    }
  }

  private cleanupImageResources(): void {
    if (this.imageSubscription) {
      this.imageSubscription.unsubscribe();
      this.imageSubscription = null;
    }
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.error = '';

    this.authService.getUserProfile().subscribe({
      next: (profile) => {
        // O subject já é atualizado automaticamente pelo AuthService
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar perfil:', error);
        this.error = 'Erro ao carregar dados do usuário';
        this.isLoading = false;
      }
    });
  }

  private loadProfileImage(): void {
    this.cleanupImageResources();

    if (this.userData?.mongoId && this.userHasImage()) {
      //console.log('📸 Carregando imagem...');

      // Inicia o loading da imagem
      this.isImageLoading = true;
      this.hasImageError = false;
      
      this.imageSubscription = this.imageService.getProfileImage(this.userData.mongoId).subscribe({
        next: (secureUrl) => {
          this.imageBlobUrl = secureUrl;
          this.isImageLoading = false;
        //  console.log('✅ Imagem carregada com sucesso');
        },
        error: (error) => {
          console.error('❌ Erro ao carregar imagem:', error);
          this.imageBlobUrl = null;
          this.isImageLoading = false;
          this.hasImageError = true;

          if (error.status === 404) {
          //  console.log('ℹ️ Imagem não encontrada no servidor');
          }
        }
      });
    } else {
      this.imageBlobUrl = null;
      this.isImageLoading = false; 
      this.hasImageError = false;
    }
  }

  private userHasImage(): boolean {
    if (!this.userData) return false;
    return !!(this.userData.imagemFileId || this.userData.imagemUrl);
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput?.click();
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    
    if (file) {
      if (!file.type.startsWith('image/')) {
        Swal.fire({
          title: 'Tipo de arquivo inválido ⚠️',
          text: 'Por favor, selecione apenas arquivos de imagem.',
          icon: 'warning',
          confirmButtonText: 'Ok',
          confirmButtonColor: '#FF9800'
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          title: 'Tamanho do arquivo inválido ⚠️',
          text: 'A imagem deve ter no máximo 5MB.',
          icon: 'warning',
          confirmButtonText: 'Ok',
          confirmButtonColor: '#FF9800'
        });
        return;
      }

      this.selectedFile = file;
      this.uploadImage();
    }
  }

  uploadImage(): void {
    if (!this.selectedFile || !this.userData?.mongoId) return;

    this.isUploading = true;
    
    this.authService.uploadProfileImage(this.userData.mongoId, this.selectedFile).subscribe({
      next: (response) => {
       // console.log('✅ Imagem uploadada com sucesso');
        
        // O AuthService já atualizou automaticamente o userData via Subject
        // Só precisamos recarregar a imagem visual

        // Reseta os estados de loading
        this.isImageLoading = true;
        this.hasImageError = false;
        
        setTimeout(() => {
          this.loadProfileImage();
        }, 800);
        
        this.isUploading = false;
        this.selectedFile = null;
        this.showImageMenu = false;
      },
      error: (error) => {
        console.error('❌ Erro ao fazer upload da imagem:', error);
        this.isUploading = false;
        Swal.fire({
          title: 'Erro ao fazer upload da imagem ❌',
          text: 'Erro ao fazer upload da imagem. Tente novamente.',
          icon: 'error',
          confirmButtonText: 'Tentar novamente',
          confirmButtonColor: '#f44336'
        });
      }
    });
  }

  removeImage(): void {
    if (!this.userData?.mongoId) return;

    this.isUploading = true;
    
    this.authService.removeProfileImage(this.userData.mongoId).subscribe({
      next: (response) => {
       // console.log('✅ Imagem removida com sucesso');
        
        // O AuthService já atualizou automaticamente o userData via Subject
        // Só precisamos remover a imagem visual
        
        this.imageBlobUrl = null;
        this.isUploading = false;
        this.showImageMenu = false;
      },
      error: (error) => {
        console.error('❌ Erro ao remover imagem:', error);
        this.isUploading = false;
        Swal.fire({
          title: 'Erro ao remover imagem ❌',
          text: 'Erro ao remover imagem. Tente novamente.',
          icon: 'error',
          confirmButtonText: 'Tentar novamente',
          confirmButtonColor: '#f44336'
        });
      }
    });
  }

  showFavoritos(): void {
    this.currentView = 'favoritos';
    this.rolarParaConteudo();
  }

  showCriarUsuario(): void {
    this.currentView = 'criar-usuario';
    this.rolarParaConteudo();
  }

  showVisualizarUsuarios(): void {
    this.currentView = 'visualizar-usuarios';
    this.rolarParaConteudo();
  }

  onUsuarioCriado(): void {
    // Pode adicionar lógica adicional se necessário
    this.showFavoritos(); // Volta para favoritos após criar
  }

  onCancelarCriacao(): void {
    this.showFavoritos();
  }

  toggleImageMenu(): void {
    this.showImageMenu = !this.showImageMenu;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  getUserName(): string {
    if(!this.userData?.email) return 'usuário';
    return this.userData.email.split('@')[0];
  }

  getUserInitial(): string {
    if(!this.userData?.nome) return 'U';
    return this.userData.nome.charAt(0).toUpperCase();
  }

  // MÉTODO - Scroll para área específica
  private rolarParaConteudo(): void {
    setTimeout(() => {
      const elemento = document.querySelector('.user-bookmarks');
      if (elemento) {
        elemento.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      } else {
        // Fallback para topo da página
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  }

  toggleUserInfo() {
    this.isInfoExpanded = !this.isInfoExpanded;
    
    // Opcional: Adicionar/remover classe no elemento
    const infoBox = document.querySelector('.user-content > .profile-other-info-box:first-of-type');
    if (infoBox) {
      if (this.isInfoExpanded) {
        infoBox.classList.add('expanded');
      } else {
        infoBox.classList.remove('expanded');
      }
    }
  }
}