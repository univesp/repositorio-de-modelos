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
import { ModeloService } from '../../services/modelo.service';
import { ModeloCadastroRequest } from '../../interfaces/modelo/modelo-create-request.interface';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import Swal from 'sweetalert2';

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
    mostrarBotaoEdicao: boolean = false;

    private imagensSimilaresCache = new Map<string, string>();
    private carregandoImagensSimilares = new Set<string>();

    userProfile: any = null;
    isAdmin: boolean = false;
    isCriadorDoModelo: boolean = false;

    // Propriedades para o Código Zip
    @ViewChild('zipInput') zipInput!: ElementRef<HTMLInputElement>;
    temCodigoZip: boolean = false;
    baixandoZip: boolean = false;
    uploadingZip: boolean = false;
    removendoZip: boolean = false;
    nomeArquivoZip: string = '';

    // Referência para o input de arquivo
    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

    //edição do modelo
    modalEdicaoAberto: boolean = false;
    
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
        private uploadImagemService: UploadImagemService,
        private modeloService: ModeloService,
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
        });

        setTimeout(() => {
            this.carregarModeloCompleto();
        }, 100);
    }

    private verificarSeECriadorDoModelo(): void {
        if (!this.userProfile || !this.currentModeloAPI) {
            this.isCriadorDoModelo = false;
            return;
        }
        
        const criadorDoModelo = this.currentModeloAPI.createdBy;
        const usuarioLogadoEmail = this.userProfile.email;
        
        this.isCriadorDoModelo = criadorDoModelo === usuarioLogadoEmail;
    }

    private carregarImagemCustomizada(modeloId: string): void {
        if (!modeloId) return;

        this.imagemCarregando = true;
        
        this.uploadImagemService.getImagemModelo(modeloId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
            next: (blob) => {
                this.imagemCustomizadaUrl = URL.createObjectURL(blob);
                this.imagemCarregando = false;
            },
            error: (error) => {
                this.imagemCustomizadaUrl = null;
                this.imagemCarregando = false;
            }
            });
    }

    obterImagemParaModeloSimilar(modelo: Modelo): string {
        const modeloId = modelo.id;
        
        if (this.imagensSimilaresCache.has(modeloId)) {
            return this.imagensSimilaresCache.get(modeloId)!;
        }
        
        if (!this.carregandoImagensSimilares.has(modeloId)) {
            this.carregandoImagensSimilares.add(modeloId);
            
            this.uploadImagemService.getImagemModelo(modeloId)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                next: (blob) => {
                    const url = URL.createObjectURL(blob);
                    this.imagensSimilaresCache.set(modeloId, url);
                    this.carregandoImagensSimilares.delete(modeloId);
                },
                error: (error) => {
                    this.carregandoImagensSimilares.delete(modeloId);
                }
                });
        }
        
        return modelo.img_lg || 'assets/images/placeholder-modelo.svg';
    }

    // ========== MÉTODOS DO CÓDIGO ZIP (FETCH DIRETO) ==========

    abrirSeletorZip(): void {
        if (!this.podeGerenciarModelo) return;
        this.zipInput.nativeElement.click();
    }

    async onZipSelected(event: any): Promise<void> {
        const arquivo: File = event.target.files[0];
        if (!arquivo || !this.currentModelo) return;

        // SALVA O NOME DO ARQUIVO!
        this.nomeArquivoZip = arquivo.name;
        
        this.uploadingZip = true;
        
        // SOLUÇÃO QUE FUNCIONA!
        const token = this.authService.getToken();
        const formData = new FormData();
        formData.append('file', arquivo, arquivo.name);

        try {
            const response = await fetch(`/api/modelos/${this.currentModelo.id}/codigo`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                console.log('✅ Upload funcionou!');
                this.temCodigoZip = true;
                if (this.currentModelo) {
                    this.currentModelo.temCodigoZip = true;
                }
                
                Swal.fire({
                    title: 'Sucesso!',
                    text: 'Código-fonte enviado com sucesso',
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
                
            } else {
                console.log('❌ Falhou:', response.status);
                Swal.fire({
                    title: 'Erro!',
                    text: `Erro ${response.status} ao enviar arquivo`,
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
            
        } catch (error) {
            console.error('💥 Erro:', error);
            Swal.fire({
                title: 'Erro!',
                text: 'Erro ao enviar arquivo',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        } finally {
            this.uploadingZip = false;
            this.limparSelecaoZip();
        }
    }

    async baixarCodigoZip(): Promise<void> {
        if (!this.currentModelo || this.baixandoZip) return;
        
        this.baixandoZip = true;
        
        const token = this.authService.getToken();

        try {
            const response = await fetch(`/api/modelos/${this.currentModelo.id}/codigo`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `codigo-fonte_${this.currentModelo.titulo.replace(/[^a-z0-9]/gi, '_')}.zip`;
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                window.URL.revokeObjectURL(url);
                
                console.log('✅ Download funcionou!');
                
            } else {
                console.log('❌ Falhou download:', response.status);
                Swal.fire({
                    title: 'Erro!',
                    text: `Arquivo não encontrado (${response.status})`,
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
            
        } catch (error) {
            console.error('💥 Erro download:', error);
            Swal.fire({
                title: 'Erro!',
                text: 'Erro ao baixar arquivo',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        } finally {
            this.baixandoZip = false;
        }
    }

    async removerCodigoZip(): Promise<void> {
        if (!this.currentModelo || this.removendoZip) return;
        
        const result = await Swal.fire({
            title: 'Remover código-fonte?',
            text: `Tem certeza que deseja remover o arquivo ZIP de "${this.currentModelo.titulo}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sim, remover!',
            cancelButtonText: 'Cancelar'
        });
        
        if (!result.isConfirmed) return;
        
        this.removendoZip = true;
        
        const token = this.authService.getToken();

        try {
            const response = await fetch(`/api/modelos/${this.currentModelo.id}/codigo`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                console.log('✅ Remoção funcionou!');
                this.temCodigoZip = false;
                if (this.currentModelo) {
                    this.currentModelo.temCodigoZip = false;
                }
                
                Swal.fire({
                    title: 'Removido!',
                    text: 'Código-fonte removido com sucesso',
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
                
            } else {
                console.log('❌ Falhou remoção:', response.status);
                Swal.fire({
                    title: 'Erro!',
                    text: `Erro ${response.status} ao remover arquivo`,
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
            
        } catch (error) {
            console.error('💥 Erro remoção:', error);
            Swal.fire({
                title: 'Erro!',
                text: 'Erro ao remover arquivo',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        } finally {
            this.removendoZip = false;
        }
    }

    private limparSelecaoZip(): void {
        if (this.zipInput?.nativeElement) {
            this.zipInput.nativeElement.value = '';
        }
    }

    // ========== FIM DOS MÉTODOS DO CÓDIGO ZIP ==========

    private carregarModeloCompleto(): void {
        if (this.estaCarregando) return;
        
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
    
        this.apiModelosService.getModeloPorIdDaAPI(id).subscribe({
            next: (modeloAPI) => {
                if (!modeloAPI) {
                    this.isLoading = false;
                    this.estaCarregando = false;
                    return;
                }
    
                this.currentModelo = this.modeloConverterService.converterAPIparaModelo(modeloAPI);
                this.currentModeloAPI = modeloAPI;
                this.currentModelo.isSalvo = this.bookmarkService.isSalvo(this.currentModelo.id);

                this.verificarSeECriadorDoModelo();
                this.carregarImagemCustomizada(id);
                
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
                this.isLoading = false;
                this.currentModelo = null;
                this.estaCarregando = false;
            }
        });
    }

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

    get podeGerenciarModelo(): boolean {
        return this.isLoggedIn && (this.isAdmin || this.isCriadorDoModelo);
    }

    get mostrarBadgeImagemAcoes(): boolean {
        return this.podeGerenciarModelo && this.mostrarBotoesImagem;
    }

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

    // ========== MÉTODOS DA IMAGEM ==========

    abrirSeletorImagem(): void {
        this.fileInput.nativeElement.click();
    }

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
                this.carregarImagemCustomizada(this.currentModelo!.id.toString());
            }
            
            this.limparSelecao();
            
        } catch (error) {
            console.error('Erro no upload:', error);
        } finally {
            this.isUploading = false;
        }
    }

    async removerImagem(): Promise<void> {
        if (!this.currentModelo) return;

        if (!this.temImagemCustomizada) {
            this.uploadImagemService.mostrarSucesso('Já está usando imagem padrão');
            return;
        }

        await this.uploadImagemService.executarRemocaoImagem(
            this.currentModelo.id.toString(),
            this.currentModelo.titulo
        );
    }

    private limparSelecao(): void {
        this.arquivoSelecionado = null;
        this.previewImagem = null;
        if (this.fileInput?.nativeElement) {
            this.fileInput.nativeElement.value = '';
        }
    }

    get imagemParaExibir(): string {
        if (this.imagemCustomizadaUrl) {
            return this.imagemCustomizadaUrl;
        }
        
        if (this.currentModelo?.img_lg) {
            return this.currentModelo.img_lg;
        }
        
        return 'assets/images/placeholder-modelo.svg';
    }

    get temImagemCustomizada(): boolean {
        return !!this.imagemCustomizadaUrl;
    }

    // ========== MÉTODOS GERAIS ==========

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
        this.modalEdicaoAberto = true;
    }

    fecharModalEdicao(): void {
        this.modalEdicaoAberto = false;
    }

    salvarEdicao(dadosEditados: ModeloCadastroRequest): void {
        if (!this.currentModeloAPI) return;
      
        // Preparar os dados para envio
        const dadosParaEnviar = {
          ...dadosEditados,
          // Garantir que campos obrigatórios da API estão presentes
          ano: this.currentModeloAPI.ano,
          mes: this.currentModeloAPI.mes,
          dia: this.currentModeloAPI.dia,
          date: this.currentModeloAPI.date,
          autoria: this.currentModeloAPI.autoria,
          carousel: this.currentModeloAPI.carousel,
          destaque: this.currentModeloAPI.destaque,
          // Tratar a equipe
          equipe: dadosEditados.hasEquipe ? {
            docente: dadosEditados.equipe?.docente || '',
            coordenacao: dadosEditados.equipe?.coordenacao || '',
            roteirizacao: dadosEditados.equipe?.roteirizacao || '',
            layout: dadosEditados.equipe?.layout || '',
            ilustracao: dadosEditados.equipe?.ilustracao || '',
            programacao: dadosEditados.equipe?.programacao || ''
          } : undefined
        };
      
        this.modeloService.atualizarModelo(
          this.currentModeloAPI.id,
          dadosParaEnviar
        ).subscribe({
          next: (modeloAtualizado) => {
            // Atualiza os dados locais
            this.currentModeloAPI = modeloAtualizado;
            this.currentModelo = this.modeloConverterService.converterAPIparaModelo(modeloAtualizado);
            
            // Fecha o modal
            this.modalEdicaoAberto = false;
            
            // Mostra mensagem de sucesso
            Swal.fire({
              icon: 'success',
              title: 'Sucesso!',
              text: 'Modelo atualizado com sucesso',
              confirmButtonColor: '#7155d8',
              timer: 3000
            });
          },
          error: (error) => {
            console.error('Erro ao atualizar modelo:', error);
            Swal.fire({
              icon: 'error',
              title: 'Erro!',
              text: 'Erro ao atualizar modelo. Tente novamente.',
              confirmButtonColor: '#7155d8'
            });
          }
        });
      }
    

    esconderBotoesImagem(): void {
        this.mostrarBotoesImagem = false;
        this.mostrarBotaoEdicao = false;
    }

    mostrarBotoesImagemTemporariamente(): void {
        this.mostrarBotoesImagem = true;
        
        // Auto-esconder após 8 segundos
        setTimeout(() => {
          if (this.mostrarBotoesImagem) {
            this.esconderBotoesImagem();
          }
        }, 8000);
      }

    get estaNoCarrossel(): boolean {
        return this.currentModeloAPI?.carousel === true;
    }

    alternarNoTopo(): void {
        this.menuOpcoesAberto = false;
        
        if (!this.currentModelo || !this.currentModeloAPI) return;
        
        if (this.estaNoCarrossel) {
            this.atualizarModeloService.removerDoTopo(
                this.currentModeloAPI,
                this.currentModelo.id.toString(),
                this.currentModelo.titulo
            );
        } else {
            this.atualizarModeloService.executarAdicionarAoTopo(
                this.currentModeloAPI,
                this.currentModelo.id.toString(),
                this.currentModelo.titulo
            );
        }
    }

    get estaNosDestaques(): boolean {
        return this.currentModeloAPI?.destaque === true;
    }

    alternarNosDestaques(): void {
        this.menuOpcoesAberto = false;
        
        if (!this.currentModelo || !this.currentModeloAPI) return;
        
        if (this.estaNosDestaques) {
            this.atualizarModeloService.removerDosDestaques(
                this.currentModeloAPI,
                this.currentModelo.id.toString(),
                this.currentModelo.titulo
            );
        } else {
            this.atualizarModeloService.adicionarAosDestaques(
                this.currentModeloAPI,
                this.currentModelo.id.toString(),
                this.currentModelo.titulo
            );
        }
    }

    excluirModelo(): void {
        this.menuOpcoesAberto = false;
        
        if (!this.currentModelo) return;
        
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
        if (this.imagemCustomizadaUrl) {
            URL.revokeObjectURL(this.imagemCustomizadaUrl);
        }

        this.imagensSimilaresCache.forEach(url => {
            URL.revokeObjectURL(url);
        });
        this.imagensSimilaresCache.clear();
        this.carregandoImagensSimilares.clear();
        
        this.destroy$.next();
        this.destroy$.complete();
    }
}