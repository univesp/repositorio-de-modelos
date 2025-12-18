import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Modelo } from '../../interfaces/modelo/modelo.interface';
import { ModeloAPI } from '../../interfaces/modelo/modelo-api.interface';
import { BookmarkService } from '../../services/bookmark.service';
import { ModoExplorarService } from '../../services/modo-explorar.service';
import { AuthService } from '../../services/auth.service';
import { ApiModelosService } from '../../services/api-modelos.service';
import { AtualizarModeloService } from '../../services/atualizar-modelo.service';
import { UploadImagemService } from '../../services/upload-imagem.service';
import { ExcluirModeloService } from '../../services/excluir-modelo.service';
import { ModeloConverterService } from '../../services/modelo-converter.service';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
    selector: 'app-modelo',
    templateUrl: './modelo.component.html',
    styleUrl: './modelo.component.scss'
})
export class ModeloComponent implements OnInit, OnDestroy {
    currentModelo: Modelo | null = null;
    currentModeloAPI: ModeloAPI | null = null;
    modelosSimilares: Modelo[] = [];
    todosModelosDaAPI: Modelo[] = [];
    private destroy$ = new Subject<void>();
    modalAberto: boolean = false;
    imagemModal: string = '';
    isLoggedIn: boolean = false;
    menuOpcoesAberto: boolean = false;
    isLoading: boolean = true;
    private estaCarregando = false; 
    isUploading: boolean = false;
    previewImagem: string | null = null;
    arquivoSelecionado: File | null = null;
    imagemCustomizadaUrl: string | null = null;
    imagemCarregando: boolean = false;
    mostrarBotoesImagem: boolean = false;

    private imagensSimilaresCache = new Map<string, string>();
    private carregandoImagensSimilares = new Set<string>();

    userProfile: any = null;
    isAdmin: boolean = false;
    isCriadorDoModelo: boolean = false;

    // Referência para o input de arquivo
    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
    
    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private bookmarkService: BookmarkService,
        private modoExplorarService: ModoExplorarService,
        public authService: AuthService,
        private apiModelosService: ApiModelosService,
        private modeloConverterService: ModeloConverterService,
        private excluirModeloService: ExcluirModeloService,
        private atualizarModeloService: AtualizarModeloService,
        private uploadImagemService: UploadImagemService
    ) {
        // Escuta mudanças de rota
        this.router.events
        .pipe(
            filter((event): event is NavigationEnd => event instanceof NavigationEnd),
            takeUntil(this.destroy$)
        )
        .subscribe((event: NavigationEnd) => {
            if (this.estaCarregando) {
                return;
            }
            this.carregarModeloCompleto();
        });
    }

    ngOnInit() {
        this.isLoggedIn = this.authService.isSignedIn();

        this.authService.isAuthenticated().subscribe(loggedIn => {
            this.isLoggedIn = loggedIn;
        });

        // Observa perfil do usuário
        this.authService.userProfile$.pipe(
            takeUntil(this.destroy$)
        ).subscribe(profile => {
            this.userProfile = profile;
            this.isAdmin = profile?.role === 'ADMIN';
            this.verificarSeECriadorDoModelo();
        })

        setTimeout(() => {
            this.carregarModeloCompleto();
        }, 100);
    }

    private verificarSeECriadorDoModelo(): void {
        if (!this.userProfile || !this.currentModeloAPI) {
            this.isCriadorDoModelo = false;
            return;
        }
        
        // Verifica se o usuário logado é o criador do modelo
        const criadorDoModelo = this.currentModeloAPI.createdBy;
        const usuarioLogadoEmail = this.userProfile.email;
        
        this.isCriadorDoModelo = criadorDoModelo === usuarioLogadoEmail;
    }


    private carregarImagemCustomizada(modeloId: string): void {
    if (!modeloId) return;

    this.imagemCarregando = true;
    
    // Tenta buscar imagem customizada
    this.uploadImagemService.getImagemModelo(modeloId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
        next: (blob) => {
            // Cria URL do blob
            this.imagemCustomizadaUrl = URL.createObjectURL(blob);
            console.log('✅ Imagem customizada carregada');
            this.imagemCarregando = false;
        },
        error: (error) => {
            this.imagemCustomizadaUrl = null;
            this.imagemCarregando = false; // Termina loading mesmo com erro
        }
        });
    }

    /**
    * Obtém imagem para modelos similares
    */
    obterImagemParaModeloSimilar(modelo: Modelo): string {
        const modeloId = modelo.id;
        
        // 1. Se já tem no cache, retorna
        if (this.imagensSimilaresCache.has(modeloId)) {
        return this.imagensSimilaresCache.get(modeloId)!;
        }
        
        // 2. Se não está carregando, inicia o carregamento
        if (!this.carregandoImagensSimilares.has(modeloId)) {
        this.carregandoImagensSimilares.add(modeloId);
        
        this.uploadImagemService.getImagemModelo(modeloId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
            next: (blob) => {
                // Cria URL e salva no cache
                const url = URL.createObjectURL(blob);
                this.imagensSimilaresCache.set(modeloId, url);
                this.carregandoImagensSimilares.delete(modeloId);
            },
            error: (error) => {
                // Se erro, remove do set de carregamento
                this.carregandoImagensSimilares.delete(modeloId);
            }
            });
        }
        
        // 3. Enquanto carrega ou se der erro, retorna a imagem padrão
        return modelo.img_lg || 'assets/images/placeholder-modelo.svg';
    }

    /**
     * CARREGA MODELO + TODOS OS MODELOS DA API
     */
    private carregarModeloCompleto(): void {
        if (this.estaCarregando) {
            return;
        }
        
        this.estaCarregando = true;
        window.scrollTo(0, 0);
        
        const id = this.route.snapshot.paramMap.get('id');
    
        if (!id) {
            this.router.navigate(['/404']);
            this.estaCarregando = false;
            return;
        }
    
        this.isLoading = true;
        this.currentModelo = null;
        this.modelosSimilares = [];
        this.todosModelosDaAPI = [];
    
        // 1. BUSCA APENAS O MODELO PRINCIPAL
        this.apiModelosService.getModeloPorIdDaAPI(id).subscribe({
            next: (modeloAPI) => {
                if (!modeloAPI) {
                    this.isLoading = false;
                    this.estaCarregando = false;
                    return;
                }
    
                // Modelo encontrado!
                this.currentModelo = this.modeloConverterService.converterAPIparaModelo(modeloAPI);
                this.currentModeloAPI = modeloAPI;
                this.currentModelo.isSalvo = this.bookmarkService.isSalvo(this.currentModelo.id);

                // VERIFICA SE É O CRIADOR DO MODELO
                this.verificarSeECriadorDoModelo();

                // TENTA CARREGAR IMAGEM CUSTOMIZADA
                this.carregarImagemCustomizada(id);
                
                // 2. BUSCA MODELOS SIMILARES
                this.apiModelosService.getModelosDaAPI().subscribe({
                    next: (todosModelosAPI) => {
                        if (todosModelosAPI.length > 0) {
                            this.todosModelosDaAPI = this.modeloConverterService.converterArrayAPIparaModelo(todosModelosAPI);
                            
                            this.todosModelosDaAPI.forEach(modelo => {
                                modelo.isSalvo = this.bookmarkService.isSalvo(modelo.id);
                            });
                            
                            this.carregarModelosSimilares();
                        }
                        
                        this.finalizarCarregamento(id);
                        this.estaCarregando = false;
                    },
                    error: (error) => {
                        this.finalizarCarregamento(id);
                        this.estaCarregando = false;
                    }
                });
            },
            error: (error) => {
                if (error.status === 404) {
                    this.isLoading = false;
                    this.currentModelo = null;
                } else {
                    this.isLoading = false;
                    this.currentModelo = null;
                }
                
                this.estaCarregando = false;
            }
        });
    }

    /**
     * FINALIZA O CARREGAMENTO
     */
    private finalizarCarregamento(id: string): void {
        if (!this.currentModelo) {
            this.isLoading = false;
            return;
        }

        this.modoExplorarService.setModoExplorarAtivo(false);
        this.modoExplorarService.setModeloId(Number(id));
        this.modoExplorarService.setFiltrosAtuais({});
        
        this.isLoading = false;
    }

    // getter para verificar se pode editar imagem:
    get podeGerenciarModelo(): boolean {
        // Retorna true se:
        // 1. Usuário está logado
        // 2. E (é ADMIN OU é o criador do modelo)
        return this.isLoggedIn && (this.isAdmin || this.isCriadorDoModelo);
    }

    get mostrarBadgeImagemAcoes(): boolean {
        return this.podeGerenciarModelo && this.mostrarBotoesImagem;
    }

    /**
     * CARREGA MODELOS SIMILARES
     */
    private carregarModelosSimilares(): void {
        if (!this.currentModelo || this.todosModelosDaAPI.length === 0) {
            this.modelosSimilares = [];
            return;
        }

        const modelosFiltrados = this.todosModelosDaAPI.filter(modelo => {
            if (modelo.id === this.currentModelo!.id) return false;
            
            return this.temCategoriaComum(modelo) ||
                   this.temTagsComuns(modelo) ||
                   this.temAreaComum(modelo) ||
                   this.temCursoComum(modelo);
        });

        if (modelosFiltrados.length === 0) {
            this.modelosSimilares = [];
            return;
        }

        if (modelosFiltrados.length <= 4) {
            this.modelosSimilares = modelosFiltrados;
        } else {
            this.modelosSimilares = this.embaralharArray(modelosFiltrados).slice(0, 4);
        }
    }
    
    private embaralharArray(array: Modelo[]): Modelo[] {
        const arrayEmbaralhado = [...array];
        
        for (let i = arrayEmbaralhado.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arrayEmbaralhado[i], arrayEmbaralhado[j]] = [arrayEmbaralhado[j], arrayEmbaralhado[i]];
        }
        
        return arrayEmbaralhado;
    }

    private temCategoriaComum(modelo: Modelo): boolean {
        if (!this.currentModelo!.categorias || !modelo.categorias || 
            this.currentModelo!.categorias.length === 0 || modelo.categorias.length === 0) {
            return false;
        }
        
        return this.currentModelo!.categorias.some(categoriaAtual => 
            modelo.categorias.includes(categoriaAtual)
        );
    }

    private temTagsComuns(modelo: Modelo): boolean {
        if (!this.currentModelo!.tags || !modelo.tags || 
            this.currentModelo!.tags.length === 0 || modelo.tags.length === 0) {
            return false;
        }
        
        return this.currentModelo!.tags.some(tagAtual => 
            modelo.tags.includes(tagAtual)
        );
    }

    private temAreaComum(modelo: Modelo): boolean {
        if (!this.currentModelo!.area || !modelo.area || 
            this.currentModelo!.area.length === 0 || modelo.area.length === 0) {
            return false;
        }
        
        return this.currentModelo!.area.some(areaAtual => 
            modelo.area.includes(areaAtual)
        );
    }

    private temCursoComum(modelo: Modelo): boolean {
        if (!this.currentModelo!.curso || !modelo.curso || 
            this.currentModelo!.curso.length === 0 || modelo.curso.length === 0) {
            return false;
        }
        
        return this.currentModelo!.curso.some(cursoAtual => 
            modelo.curso.includes(cursoAtual)
        );
    }

    /**
     * Abre o seletor de arquivos
     */
    abrirSeletorImagem(): void {
        this.fileInput.nativeElement.click();
    }

    /**
     * Quando um arquivo é selecionado (UPLOAD DIRETO)
     */
    async onFileSelected(event: any): Promise<void> {
        const arquivo: File = event.target.files[0];
        
        if (!arquivo) return;
        
        const validacao = this.uploadImagemService.validarArquivo(arquivo);
        if (!validacao.valido) {
          this.uploadImagemService.mostrarErro(validacao.mensagem!);
          this.limparSelecao();
          return;
        }
      
        this.isUploading = true;
        
        try {
          const sucesso = await this.uploadImagemService.executarUpload(
            this.currentModelo!.id.toString(),
            this.currentModelo!.titulo,
            arquivo
          );
          
          if (sucesso) {
            // APÓS UPLOAD BEM-SUCEDIDO, RECARREGA A IMAGEM CUSTOMIZADA
            this.carregarImagemCustomizada(this.currentModelo!.id.toString());
          }
          
          this.limparSelecao();
          
        } catch (error) {
          console.error('Erro no upload:', error);
        } finally {
          this.isUploading = false;
        }
      }

    /**
     * Remove a imagem
     */
    async removerImagem(): Promise<void> {
        if (!this.currentModelo) return;

        if (!this.temImagemCustomizada) {
            // Se já não tem imagem customizada, mostra mensagem e não faz nada
            this.uploadImagemService.mostrarSucesso('Já está usando imagem padrão');
            return;
        }

        // Agora usa o novo método que já tem SweetAlert e recarregamento
        await this.uploadImagemService.executarRemocaoImagem(
            this.currentModelo.id.toString(),
            this.currentModelo.titulo
        );
    }

    /**
     * Limpa a seleção atual
     */
    private limparSelecao(): void {
        this.arquivoSelecionado = null;
        this.previewImagem = null;
        if (this.fileInput?.nativeElement) {
            this.fileInput.nativeElement.value = '';
        }
    }

    get imagemParaExibir(): string {
        // 1. Se tem imagem customizada, usa ela
        if (this.imagemCustomizadaUrl) {
          return this.imagemCustomizadaUrl;
        }
        
        // 2. Se não, usa a imagem padrão do modelo
        if (this.currentModelo?.img_lg) {
          return this.currentModelo.img_lg;
        }
        
        // 3. Fallback
        return 'assets/images/placeholder-modelo.svg';
      }

    /**
     * Verifica se o modelo tem imagem customizada
     */
    get temImagemCustomizada(): boolean {
        // Verifica se tem imagem customizada carregada
        return !!this.imagemCustomizadaUrl;
      }

    // MÉTODOS PÚBLICOS PARA O TEMPLATE
    isCodePenUrl(url: string | undefined): boolean {
        return !!url && url.includes('codepen.io');
    }

    getCodePenId(url: string | undefined): string {
        if (!this.isCodePenUrl(url)) return '';
        
        const match = url!.match(/codepen\.io\/[^/]+\/pen\/([^/?]+)/);
        return match ? match[1] : '';
    }

    getCodePenUser(url: string | undefined): string {
        if (!this.isCodePenUrl(url)) return '';
        
        const match = url!.match(/codepen\.io\/([^/]+)\/pen\//);
        return match ? match[1] : '';
    }

    toggleBookmark(modelo: Modelo) {
        if (!this.isLoggedIn) return;
        
        modelo.isSalvo = !modelo.isSalvo;
        this.bookmarkService.toggle(modelo.id);
        
        if (this.currentModelo && this.currentModelo.id === modelo.id) {
            this.currentModelo.isSalvo = modelo.isSalvo;
        }
    }

    navegarParaModelo(modeloId: string) {
        this.router.navigate(['/modelo', modeloId]);
    }

    abrirModalImagem(imagemUrl: string) {
        this.imagemModal = imagemUrl;
        this.modalAberto = true;
        document.body.style.overflow = 'hidden';
    }

    fecharModalImagem() {
        this.modalAberto = false;
        this.imagemModal = '';
        document.body.style.overflow = 'auto';
    }

    toggleMenuOpcoes(): void {
        this.menuOpcoesAberto = !this.menuOpcoesAberto;
    }

    editarModelo(): void {
        this.menuOpcoesAberto = false;
        this.mostrarBotoesImagem = true;

        // Opcional: Esconde os botões automaticamente após 5 segundos
        setTimeout(() => {
            this.mostrarBotoesImagem = false;
        }, 5000);
    }

    // método para esconder os botões:
    esconderBotoesImagem(): void {
        this.mostrarBotoesImagem = false;
    }

    /**
     * Verifica se o modelo está no carrossel (topo)
     */
    get estaNoCarrossel(): boolean {
        return this.currentModeloAPI?.carousel === true;
    }

    /**
     * Alterna entre adicionar/remover do topo (carrossel)
     */
    alternarNoTopo(): void {
        this.menuOpcoesAberto = false;
        
        if (!this.currentModelo || !this.currentModeloAPI) {
        return;
        }
        
        if (this.estaNoCarrossel) {
        // Se já está no topo, remove
        this.atualizarModeloService.removerDoTopo(
            this.currentModeloAPI,
            this.currentModelo.id.toString(),
            this.currentModelo.titulo
        );
        } else {
        // Se não está no topo, adiciona
        this.atualizarModeloService.executarAdicionarAoTopo(
            this.currentModeloAPI,
            this.currentModelo.id.toString(),
            this.currentModelo.titulo
        );
        }
    }

    /**
     * Verifica se o modelo está nos destaques
     */
    get estaNosDestaques(): boolean {
        return this.currentModeloAPI?.destaque === true;
    }

    /**
     * Alterna entre adicionar/remover dos destaques
     */
    alternarNosDestaques(): void {
        this.menuOpcoesAberto = false;
        
        if (!this.currentModelo || !this.currentModeloAPI) {
        return;
        }
        
        if (this.estaNosDestaques) {
        // Se já está nos destaques, remove
        this.atualizarModeloService.removerDosDestaques(
            this.currentModeloAPI,
            this.currentModelo.id.toString(),
            this.currentModelo.titulo
        );
        } else {
        // Se não está nos destaques, adiciona
        this.atualizarModeloService.adicionarAosDestaques(
            this.currentModeloAPI,
            this.currentModelo.id.toString(),
            this.currentModelo.titulo
        );
        }
    }

    excluirModelo(): void {
        this.menuOpcoesAberto = false;
        
        if (!this.currentModelo) {
          return;
        }
        
        this.excluirModeloService.executarExclusao(
          this.currentModelo.id.toString(),
          this.currentModelo.titulo
        );
    }

    voltarParaExplorar(): void {
        this.router.navigate(['/explorar']);
    }

    @HostListener('document:keydown.escape', ['$event'])
    fecharModalComEsc(event: Event) {
        if (this.modalAberto) {
            this.fecharModalImagem();
        }
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        if (!target.closest('.modelo-action-buttons')) {
            this.menuOpcoesAberto = false;
        }
    }

    ngOnDestroy() {
        // Libera a URL do blob da memória
        if (this.imagemCustomizadaUrl) {
          URL.revokeObjectURL(this.imagemCustomizadaUrl);
        }

        // LIMPA CACHE DOS MODELOS SIMILARES
        this.imagensSimilaresCache.forEach(url => {
            URL.revokeObjectURL(url);
        });
        this.imagensSimilaresCache.clear();
        this.carregandoImagensSimilares.clear();
        
        this.destroy$.next();
        this.destroy$.complete();
      }
}