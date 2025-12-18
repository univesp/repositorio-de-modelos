import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Modelo } from '../../interfaces/modelo/modelo.interface';
import { BookmarkService } from '../../services/bookmark.service';
import { AuthService } from '../../services/auth.service';
import { ApiModelosService } from '../../services/api-modelos.service';
import { ModeloConverterService } from '../../services/modelo-converter.service'; // IMPORTANTE!
import { UploadImagemService } from '../../services/upload-imagem.service'; // IMPORTANTE!

@Component({
  selector: 'app-destaques',
  templateUrl: './destaques.component.html',
  styleUrls: ['./destaques.component.scss']
})
export class DestaquesComponent implements OnInit, OnDestroy {

  modelosDestaque: Modelo[] = [];
  isLoading: boolean = true;
  isLoggedIn: boolean = false;
  
  // Cache de imagens (igual ao carousel)
  private imagensCache = new Map<string, string>();
  private carregandoImagens = new Set<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private bookmarkService: BookmarkService,
    private authService: AuthService,
    private apiModelosService: ApiModelosService,
    private modeloConverterService: ModeloConverterService, // INJETAR
    private uploadImagemService: UploadImagemService // INJETAR
  ) {}

  ngOnInit() {
    this.carregarModelosDestaque(); // CARREGA DA API
    
    this.isLoggedIn = this.authService.isSignedIn();

    // Escuta mudanças de autenticação
    this.authService.isAuthenticated().subscribe(loggedIn => {
      this.isLoggedIn = loggedIn;
    });

    // Sincroniza os bookmarks com o perfil do usuário
    this.authService.userProfile$.subscribe(profile => {
      if (profile && this.modelosDestaque.length > 0) {
        this.sincronizarBookmarks(profile.salvos || []);
      }
    });
  }

  ngOnDestroy() {
    // Limpa memória dos blobs (igual ao carousel)
    this.imagensCache.forEach(url => URL.revokeObjectURL(url));
    this.imagensCache.clear();
    this.carregandoImagens.clear();
    
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * CARREGA OS MODELOS EM DESTAQUE DA API - igual ao carousel
   */
  private carregarModelosDestaque(): void {
    this.isLoading = true;
    
    // ADICIONE ESTE MÉTODO NO ApiModelosService
    this.apiModelosService.getModelosDestaqueDaAPI()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (modelosAPI) => {
          console.log('🌟 Modelos em destaque da API:', modelosAPI.length);
          
          if (modelosAPI.length > 0) {
            // CONVERTE usando o mesmo service do carousel
            this.modelosDestaque = this.modeloConverterService.converterArrayAPIparaModelo(modelosAPI);
            
            // PRÉ-CARREGA IMAGENS (igual ao carousel)
            this.preCarregarImagens(this.modelosDestaque);
            
            // Sincroniza bookmarks após carregar
            this.sincronizarBookmarksInicial();
            
            console.log('✅ Destaques carregados:', this.modelosDestaque.map(m => m.titulo));
          } else {
            this.modelosDestaque = [];
            console.log('ℹ️ Nenhum modelo em destaque');
          }
          
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Erro ao carregar destaques:', error);
          this.modelosDestaque = [];
          this.isLoading = false;
        }
      });
  }

  /**
   * PRÉ-CARREGA IMAGENS DOS MODELOS - igual ao carousel
   */
  private preCarregarImagens(modelos: Modelo[]): void {
    modelos.forEach(modelo => {
      if (!this.imagensCache.has(modelo.id) && !this.carregandoImagens.has(modelo.id)) {
        this.carregandoImagens.add(modelo.id);
        
        this.uploadImagemService.getImagemModelo(modelo.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (blob) => {
              const url = URL.createObjectURL(blob);
              this.imagensCache.set(modelo.id, url);
              this.carregandoImagens.delete(modelo.id);
            },
            error: () => {
              this.carregandoImagens.delete(modelo.id);
            }
          });
      }
    });
  }

  /**
   * OBTÉM IMAGEM PARA UM MODELO - igual ao carousel
   */
  obterImagemParaModelo(modelo: Modelo): string {
    const modeloId = modelo.id;
    
    // 1. Se já tem no cache, retorna
    if (this.imagensCache.has(modeloId)) {
      return this.imagensCache.get(modeloId)!;
    }
    
    // 2. Se não está carregando, inicia o carregamento
    if (!this.carregandoImagens.has(modeloId)) {
      this.carregandoImagens.add(modeloId);
      
      this.uploadImagemService.getImagemModelo(modeloId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (blob) => {
            const url = URL.createObjectURL(blob);
            this.imagensCache.set(modeloId, url);
            this.carregandoImagens.delete(modeloId);
          },
          error: () => {
            this.carregandoImagens.delete(modeloId);
          }
        });
    }
    
    // 3. Enquanto carrega ou se der erro, retorna a imagem padrão do modelo
    return modelo.img_lg || 'assets/images/placeholder-modelo.svg';
  }

  private sincronizarBookmarks(idsSalvos: string[]): void {
    this.modelosDestaque.forEach(modelo => {
      modelo.isSalvo = idsSalvos.includes(modelo.id);
    });
  }

  private sincronizarBookmarksInicial(): void {
    const currentProfile = this.authService.getCurrentUserProfile();
    if (currentProfile && currentProfile.salvos) {
      this.sincronizarBookmarks(currentProfile.salvos);
    }
  }

  redirectModeloPage(id: string) {
    this.router.navigate([`modelo/${id}`]);
  }

  toggleBookmark(modelo: Modelo, event: Event) {
    event.stopPropagation();
    this.bookmarkService.toggle(modelo.id);
    
    // Atualiza localmente
    modelo.isSalvo = !modelo.isSalvo;
  }
}