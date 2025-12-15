import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Modelo } from '../../interfaces/modelo/modelo.interface';
import { BookmarkService } from '../../services/bookmark.service';
import { ModoExplorarService } from '../../services/modo-explorar.service';
import { AuthService } from '../../services/auth.service';
import { ApiModelosService } from '../../services/api-modelos.service';
import { ModeloConverterService } from '../../services/modelo-converter.service';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject, of } from 'rxjs';

@Component({
    selector: 'app-modelo',
    templateUrl: './modelo.component.html',
    styleUrl: './modelo.component.scss'
})
export class ModeloComponent implements OnInit, OnDestroy {
    currentModelo: Modelo | null = null;
    modelosSimilares: Modelo[] = [];
    todosModelosDaAPI: Modelo[] = [];
    private destroy$ = new Subject<void>();
    modalAberto: boolean = false;
    imagemModal: string = '';
    isLoggedIn: boolean = false;
    menuOpcoesAberto: boolean = false;
    isLoading: boolean = true;
    private estaCarregando = false; // ⚠️ NOVA FLAG PARA EVITAR LOOP
    
    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private bookmarkService: BookmarkService,
        private modoExplorarService: ModoExplorarService,
        public authService: AuthService,
        private apiModelosService: ApiModelosService,
        private modeloConverterService: ModeloConverterService
    ) {
        // Escuta mudanças de rota - VERSÃO CORRIGIDA
        this.router.events
        .pipe(
            filter((event): event is NavigationEnd => event instanceof NavigationEnd),
            takeUntil(this.destroy$)
        )
        .subscribe((event: NavigationEnd) => {
            console.log('🔍 NavigationEnd detectado:', event.url);
            
            // ⚠️ NÃO EXECUTAR SE FOR ROTA 404
            if (event.url === '/404' || event.url.includes('/404')) {
                console.log('🚫 Ignorando navegação para 404');
                return;
            }
            
            // ⚠️ SÓ EXECUTAR SE FOR ROTA DE MODELO
            if (!event.url.includes('/modelo/')) {
                console.log('🚫 Ignorando - não é rota de modelo');
                return;
            }
            
            // ⚠️ EVITA EXECUÇÃO DUPLICADA SE JÁ ESTÁ CARREGANDO
            if (this.estaCarregando) {
                console.log('🚫 Já está carregando, ignorando');
                return;
            }
            
            console.log('🔄 Recarregando modelo...');
            this.carregarModeloCompleto();
        });
    }

    ngOnInit() {
        this.isLoggedIn = this.authService.isSignedIn();

        this.authService.isAuthenticated().subscribe(loggedIn => {
            this.isLoggedIn = loggedIn;
        });

        setTimeout(() => {
            console.log('🚀 Iniciando carregamento...');
            this.carregarModeloCompleto();
        }, 100);
    }

    /**
     * CARREGA MODELO + TODOS OS MODELOS DA API
     */
    private carregarModeloCompleto(): void {
        // ⚠️ SE JÁ ESTÁ CARREGANDO, NÃO FAZ NADA
        if (this.estaCarregando) {
            console.log('🔄 Já está carregando, ignorando chamada duplicada');
            return;
        }
        
        this.estaCarregando = true; // ⚠️ MARCA COMO CARREGANDO
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
    
        console.log(`🔍 Buscando modelo ID: ${id}`);
    
        // 1. BUSCA APENAS O MODELO PRINCIPAL
        this.apiModelosService.getModeloPorIdDaAPI(id).subscribe({
            next: (modeloAPI) => {
                if (!modeloAPI) {
                    // Isso acontece para erros que não são 404
                    console.log('⚠️ Modelo retornou null (erro não-404)');
                    this.isLoading = false;
                    this.estaCarregando = false; // ⚠️ LIBERA O CARREGAMENTO
                    return;
                }
    
                // Modelo encontrado!
                this.currentModelo = this.modeloConverterService.converterAPIparaModelo(modeloAPI);
                this.currentModelo.isSalvo = this.bookmarkService.isSalvo(this.currentModelo.id);
                
                console.log(`✅ Modelo atual carregado: ${this.currentModelo.titulo}`);
    
                // 2. BUSCA MODELOS SIMILARES (apenas se encontrou o modelo principal)
                this.apiModelosService.getModelosDaAPI().subscribe({
                    next: (todosModelosAPI) => {
                        if (todosModelosAPI.length > 0) {
                            this.todosModelosDaAPI = this.modeloConverterService.converterArrayAPIparaModelo(todosModelosAPI);
                            console.log(`📊 ${this.todosModelosDaAPI.length} modelos carregados para similares`);
                            
                            this.todosModelosDaAPI.forEach(modelo => {
                                modelo.isSalvo = this.bookmarkService.isSalvo(modelo.id);
                            });
                            
                            this.carregarModelosSimilares();
                        }
                        
                        this.finalizarCarregamento(id);
                        this.estaCarregando = false; // ⚠️ LIBERA O CARREGAMENTO
                    },
                    error: (error) => {
                        console.error('❌ Erro ao buscar modelos similares:', error);
                        this.finalizarCarregamento(id);
                        this.estaCarregando = false; // ⚠️ LIBERA O CARREGAMENTO
                    }
                });
            },
            error: (error) => {
                // ⚠️ AQUI CAPTURA ERROS DO getModeloPorIdDaAPI
                console.log('🔥 Erro no getModeloPorIdDaAPI:', error);
                
                if (error.status === 404) {
                    console.log(`📭 Modelo ${error.id} não existe`);
                    
                    // ⚠️ NÃO REDIRECIONA MAIS PARA 404 - APENAS PARA O LOADING E MOSTRA MENSAGEM
                    this.isLoading = false;
                    this.currentModelo = null; // Garante que o template mostra "Modelo não disponível"
                    
                    // Se quiser redirecionar para 404 (opcional), use:
                    // this.router.navigateByUrl('/404', { skipLocationChange: true });
                } else {
                    console.log('⚠️ Outro tipo de erro');
                    this.isLoading = false;
                    this.currentModelo = null;
                }
                
                this.estaCarregando = false; // ⚠️ LIBERA O CARREGAMENTO
            }
        });
    }

    /**
     * FINALIZA O CARREGAMENTO
     */
    private finalizarCarregamento(id: string): void {
        if (!this.currentModelo) {
            console.error('❌ currentModelo é null após carregamento');
            this.isLoading = false;
            return;
        }

        console.log('✅ Carregamento finalizado:', this.currentModelo.titulo);

        // Atualiza os serviços
        this.modoExplorarService.setModoExplorarAtivo(false);
        this.modoExplorarService.setModeloId(Number(id));
        this.modoExplorarService.setFiltrosAtuais({});
        
        this.isLoading = false;
    }

    /**
     * CARREGA MODELOS SIMILARES
     */
    private carregarModelosSimilares(): void {
        if (!this.currentModelo || this.todosModelosDaAPI.length === 0) {
            console.log('Não há dados para carregar modelos similares');
            this.modelosSimilares = [];
            return;
        }

        console.log(`Buscando similares entre ${this.todosModelosDaAPI.length} modelos...`);

        const modelosFiltrados = this.todosModelosDaAPI.filter(modelo => {
            // Não inclui o próprio modelo
            if (modelo.id === this.currentModelo!.id) return false;
            
            // Verifica se tem algo em comum
            return this.temCategoriaComum(modelo) ||
                   this.temTagsComuns(modelo) ||
                   this.temAreaComum(modelo) ||
                   this.temCursoComum(modelo);
        });

        console.log(`Encontrados ${modelosFiltrados.length} modelos similares`);

        if (modelosFiltrados.length === 0) {
            this.modelosSimilares = [];
            return;
        }

        if (modelosFiltrados.length <= 4) {
            this.modelosSimilares = modelosFiltrados;
        } else {
            this.modelosSimilares = this.embaralharArray(modelosFiltrados).slice(0, 4);
        }

        console.log(`🎯 ${this.modelosSimilares.length} modelos similares serão exibidos`);
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
        
        // Se for o modelo atual, atualiza também
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
        console.log('Editar Modelo clicado');
        this.menuOpcoesAberto = false;
    }

    adicionarAoTopo(): void {
        console.log('Adicionar ao Topo clicado');
        this.menuOpcoesAberto = false;
    }

    adicionarAosDestaques(): void {
        console.log('Adicionar aos Destaques clicado');
        this.menuOpcoesAberto = false;
    }

    excluirModelo(): void {
        console.log('Excluir Modelo clicado');
        this.menuOpcoesAberto = false;
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
        this.destroy$.next();
        this.destroy$.complete();
    }
}