// components/user-favourites/user-favourites.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Modelo } from '../../interfaces/modelo/modelo.interface';
import { ModeloAPI } from '../../interfaces/modelo/modelo-api.interface';
import { SalvosService } from '../../services/salvos.service';
import { AuthService, UserProfile } from '../../services/auth.service';
import { PaginationService, PaginationConfig } from '../../services/pagination.service';
import { ApiModelosService } from '../../services/api-modelos.service';
import { ImagemDefaultUtils } from '../../utils/imagem-default.utils';
import { UploadImagemService } from '../../services/upload-imagem.service';

@Component({
  selector: 'app-user-favourites',
  templateUrl: './user-favourites.component.html',
  styleUrls: ['./user-favourites.component.scss']
})
export class UserFavouritesComponent implements OnInit, OnDestroy {
  // Arrays de dados - SALVOS
  todosModelosDaAPI: Modelo[] = [];
  modelosSalvos: Modelo[] = [];
  modelosFiltrados: Modelo[] = [];
  modelosPaginados: Modelo[] = [];

  // Arrays de dados - CRIADOS
  modelosCriados: Modelo[] = [];
  modelosCriadosFiltrados: Modelo[] = [];
  modelosCriadosPaginados: Modelo[] = [];

  // Filtros - SALVOS
  filtroTexto: string = '';
  ordenacaoSelecionada: string = 'salvos-recentes';

  // Filtros - CRIADOS
  filtroTextoCriados: string = '';
  ordenacaoSelecionadaCriados: string = 'criados-recentes';

  // Propriedades de paginação - SALVOS
  paginationConfig!: PaginationConfig;
  isLoading = true;

  // Propriedades de paginação - CRIADOS
  paginationConfigCriados!: PaginationConfig;
  isLoadingCriados = true;

  private destroy$ = new Subject<void>();

  // Cache simples de imagens
  private imagensCache = new Map<string, string>();
  // Controla quais imagens estão sendo carregadas
  private carregandoImagens = new Set<string>();

  constructor(
    private router: Router,
    private salvosService: SalvosService,
    public authService: AuthService,
    private paginationService: PaginationService,
    private apiModelosService: ApiModelosService,
    private uploadImagemService: UploadImagemService
  ) {}

  ngOnInit(): void {
    // Inicializa a configuração de paginação
    this.paginationConfig = this.paginationService.inicializarPaginacao([], 5);
    this.paginationConfigCriados = this.paginationService.inicializarPaginacao([], 5);
    
    // Carrega os modelos salvos
    this.carregarModelosSalvos();

    // Observa mudanças no perfil do usuário para carregar modelos criados
    this.authService.userProfile$.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (profile) => {
        if (profile && profile.criados && profile.criados.length > 0) {
          this.carregarModelosCriados(profile);
        } else if (profile) {
          // Usuário logado mas não tem modelos criados
          this.modelosCriados = [];
          this.modelosCriadosFiltrados = [];
          this.isLoadingCriados = false;
          this.atualizarPaginacaoCriados();
        }
      },
      error: (error) => {
        console.error('Erro ao observar perfil:', error);
        this.isLoadingCriados = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

     // Limpa as URLs de blob da memória
    this.imagensCache.forEach(url => {
      URL.revokeObjectURL(url);
    });
    this.imagensCache.clear();
    this.carregandoImagens.clear();
  }

  /**
   * CARREGA MODELOS CRIADOS PELO USUÁRIO
   */
  private carregarModelosCriados(profile: UserProfile): void {
    this.isLoadingCriados = true;
    
    // Se já carregamos todos os modelos da API, usa os dados existentes
    if (this.todosModelosDaAPI.length > 0) {
      this.filtrarModelosCriados(profile);
    } else {
      // Primeiro carrega TODOS os modelos da API
      this.apiModelosService.getModelosDaAPI()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (modelosAPI: ModeloAPI[]) => {
            console.log('📦 Todos modelos carregados da API para criados:', modelosAPI.length);
            
            // Converte todos os modelos da API para o formato interno
            this.todosModelosDaAPI = modelosAPI.map(apiModelo => 
              this.converterAPIparaModelo(apiModelo)
            );
            
            // Agora filtra apenas os modelos criados
            this.filtrarModelosCriados(profile);
          },
          error: (error) => {
            console.error('❌ Erro ao carregar modelos da API para criados:', error);
            this.isLoadingCriados = false;
            this.modelosCriados = [];
            this.modelosCriadosFiltrados = [];
            this.atualizarPaginacaoCriados();
          }
        });
    }
  }

   /**
   * FILTRA APENAS OS MODELOS CRIADOS
   */
   private filtrarModelosCriados(profile: UserProfile): void {
    if (!profile.criados || profile.criados.length === 0) {
      console.log('👤 Usuário não tem modelos criados');
      this.modelosCriados = [];
      this.modelosCriadosFiltrados = [];
      this.isLoadingCriados = false;
      this.atualizarPaginacaoCriados();
      return;
    }

    console.log('🔍 Filtrando modelos criados entre:', this.todosModelosDaAPI.length, 'modelos');
    
    // Filtra apenas os modelos que estão na lista de criados do usuário
    this.modelosCriados = this.todosModelosDaAPI.filter(modelo => 
      profile.criados!.includes(modelo.id)
    );

    console.log('✅ Modelos criados encontrados:', this.modelosCriados.length);
    
    // Inicializa os modelos filtrados
    this.modelosCriadosFiltrados = [...this.modelosCriados];
    
    // Aplica filtros iniciais
    this.aplicarFiltrosCriados();
    this.isLoadingCriados = false;
  }

   /**
   * APLICA FILTROS E ORDENAÇÃO PARA MODELOS CRIADOS
   */
   aplicarFiltrosCriados(): void {
    let modelosFiltrados = [...this.modelosCriados];

    // Filtro por texto
    if (this.filtroTextoCriados.trim()) {
      const termo = this.filtroTextoCriados.toLowerCase().trim();
      modelosFiltrados = modelosFiltrados.filter(modelo => 
        modelo.titulo.toLowerCase().includes(termo) ||
        (modelo.descricao && modelo.descricao.toLowerCase().includes(termo)) ||
        (modelo.tags && modelo.tags.some(tag => tag.toLowerCase().includes(termo)))
      );
    }

    // Aplica ordenação
    modelosFiltrados = this.aplicarOrdenacaoCriados(modelosFiltrados);
    this.modelosCriadosFiltrados = modelosFiltrados;

    // Atualiza paginação
    this.paginationConfigCriados = this.paginationService.irParaPagina(1, this.paginationConfigCriados);
    this.atualizarPaginacaoCriados();
  }

  /**
   * APLICA ORDENAÇÃO SELECIONADA PARA MODELOS CRIADOS
   */
  private aplicarOrdenacaoCriados(modelos: Modelo[]): Modelo[] {
    const userProfile = this.authService.getCurrentUserProfile();
    const criadosIds = userProfile?.criados || [];

    const ordenacao = this.ordenacaoSelecionadaCriados || 'criados-recentes';
    const modelosOrdenados = [...modelos];

    switch (ordenacao) {
      case 'criados-recentes':
        return modelosOrdenados.sort((a, b) => {
          const indexA = criadosIds.indexOf(a.id);
          const indexB = criadosIds.indexOf(b.id);
          
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          
          return indexB - indexA; // Mais recentes primeiro
        });

      case 'criados-antigos':
        return modelosOrdenados.sort((a, b) => {
          const indexA = criadosIds.indexOf(a.id);
          const indexB = criadosIds.indexOf(b.id);
          
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          
          return indexA - indexB; // Mais antigos primeiro
        });

      case 'alfabetica':
        return modelosOrdenados.sort((a, b) => 
          a.titulo.localeCompare(b.titulo, 'pt-BR', { sensitivity: 'base' })
        );

      case 'mais-recentes':
        return modelosOrdenados.sort((a, b) => {
          const dateA = this.converterDataParaTimestamp(a.date);
          const dateB = this.converterDataParaTimestamp(b.date);
          
          if (dateB === dateA) {
            return a.titulo.localeCompare(b.titulo, 'pt-BR', { sensitivity: 'base' });
          }
          
          return dateB - dateA;
        });

      case 'mais-antigos':
        return modelosOrdenados.sort((a, b) => {
          const dateA = this.converterDataParaTimestamp(a.date);
          const dateB = this.converterDataParaTimestamp(b.date);
          
          if (dateA === dateB) {
            return a.titulo.localeCompare(b.titulo, 'pt-BR', { sensitivity: 'base' });
          }
          
          return dateA - dateB;
        });

      default:
        return modelosOrdenados;
    }
  }

   /**
   * NAVEGAÇÃO ENTRE PÁGINAS - CRIADOS
   */
   irParaPaginaCriados(pagina: number): void {
    this.paginationConfigCriados = this.paginationService.irParaPagina(pagina, this.paginationConfigCriados);
    this.atualizarModelosCriadosPaginados();
    this.rolarParaTopo();
  }

  proximaPaginaCriados(): void {
    this.paginationConfigCriados = this.paginationService.proximaPagina(this.paginationConfigCriados);
    this.atualizarModelosCriadosPaginados();
    this.rolarParaTopo();
  }

  paginaAnteriorCriados(): void {
    this.paginationConfigCriados = this.paginationService.paginaAnterior(this.paginationConfigCriados);
    this.atualizarModelosCriadosPaginados();
    this.rolarParaTopo();
  }

  irParaPrimeiraPaginaCriados(): void {
    this.paginationConfigCriados = this.paginationService.irParaPrimeiraPagina(this.paginationConfigCriados);
    this.atualizarModelosCriadosPaginados();
    this.rolarParaTopo();
  }

  irParaUltimaPaginaCriados(): void {
    this.paginationConfigCriados = this.paginationService.irParaUltimaPagina(this.paginationConfigCriados);
    this.atualizarModelosCriadosPaginados();
    this.rolarParaTopo();
  }

  /**
   * ATUALIZA MODELOS CRIADOS PAGINADOS
   */
  private atualizarModelosCriadosPaginados(): void {
    this.modelosCriadosPaginados = this.paginationService.obterItensPaginados(
      this.modelosCriadosFiltrados, 
      this.paginationConfigCriados
    );
  }

  /**
   * ATUALIZA PAGINAÇÃO CRIADOS
   */
  private atualizarPaginacaoCriados(): void {
    this.paginationConfigCriados = this.paginationService.atualizarPaginacaoComNovosItens(
      this.modelosCriadosFiltrados, 
      this.paginationConfigCriados
    );
    this.modelosCriadosPaginados = this.paginationService.obterItensPaginados(
      this.modelosCriadosFiltrados, 
      this.paginationConfigCriados
    );
  }

  /**
   * GETTERS PARA O TEMPLATE - CRIADOS
   */
  get paginaAtualCriados(): number {
    return this.paginationConfigCriados.paginaAtual;
  }

  get totalPaginasCriados(): number {
    return this.paginationConfigCriados.totalPaginas;
  }

  get paginasParaExibirCriados(): number[] {
    return this.paginationConfigCriados.paginasParaExibir;
  }

  /**
   * EDITA MODELO (envia para página do modelo para edição)
   */
  editarModelo(modeloId: string, event: Event): void {
    event.stopPropagation();
    //console.log('Editar modelo:', modeloId);
    this.router.navigate(['/modelo', modeloId]);
  }

  /**
 * Retorna a imagem do cache ou inicia o carregamento
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
      
      this.uploadImagemService.getImagemModelo(modeloId).subscribe({
        next: (blob) => {
          // Cria URL e salva no cache
          const url = URL.createObjectURL(blob);
          this.imagensCache.set(modeloId, url);
          this.carregandoImagens.delete(modeloId);
        },
        error: (error) => {
          // Se erro, remove do set de carregamento
          this.carregandoImagens.delete(modeloId);
        }
      });
    }
    
    // 3. Enquanto carrega ou se der erro, retorna a imagem padrão
    return modelo.img_lg || 'assets/images/placeholder-modelo.svg';
  }

  /**
   * CARREGA MODELOS SALVOS
   */
  private carregarModelosSalvos(): void {
    this.isLoading = true;
    
    // Primeiro carrega TODOS os modelos da API
    this.apiModelosService.getModelosDaAPI()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (modelosAPI: ModeloAPI[]) => {
          console.log('📦 Todos modelos carregados da API:', modelosAPI.length);
          
          // Converte todos os modelos da API para o formato interno
          this.todosModelosDaAPI = modelosAPI.map(apiModelo => 
            this.converterAPIparaModelo(apiModelo)
          );
          
          // Agora filtra apenas os modelos salvos
          this.filtrarModelosSalvos();
        },
        error: (error) => {
          console.error('❌ Erro ao carregar modelos da API:', error);
          this.isLoading = false;
          this.modelosSalvos = [];
          this.modelosFiltrados = [];
          this.atualizarPaginacao();
        }
      });
  }

  /**
   * FILTRA APENAS OS MODELOS SALVOS
   */
  private filtrarModelosSalvos(): void {
    const userProfile = this.authService.getCurrentUserProfile();
    
    if (!userProfile || !userProfile.salvos || userProfile.salvos.length === 0) {
      console.log('👤 Usuário não tem modelos salvos');
      this.modelosSalvos = [];
      this.modelosFiltrados = [];
      this.isLoading = false;
      this.atualizarPaginacao();
      return;
    }

    console.log('🔍 Filtrando modelos salvos entre:', this.todosModelosDaAPI.length, 'modelos');
    
    // Filtra apenas os modelos que estão na lista de salvos do usuário
    this.modelosSalvos = this.todosModelosDaAPI.filter(modelo => 
      userProfile.salvos!.includes(modelo.id)
    );

    console.log('✅ Modelos salvos encontrados:', this.modelosSalvos.length);
    
    // Inicializa os modelos filtrados
    this.modelosFiltrados = [...this.modelosSalvos];
    
    // Aplica filtros iniciais
    this.aplicarFiltros();
    this.isLoading = false;
  }

  /**
   * CONVERTE ModeloAPI PARA Modelo
   */
  private converterAPIparaModelo(apiModelo: ModeloAPI): Modelo {
    const formatarData = (dataISO: string): string => {
      try {
        const date = new Date(dataISO);
        return date.toLocaleDateString('pt-BR', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        }).replace(/ de /g, ' ');
      } catch {
        return 'Data não disponível';
      }
    };

    const limparHTML = (html: string): string => {
      if (!html) return '';
      return html.replace(/<[^>]*>/g, '');
    };

    const imagemParaExibir = ImagemDefaultUtils.getImagemParaExibicao(apiModelo);

    return {
      id: apiModelo.id,
      titulo: apiModelo.titulo,
      recurso: apiModelo.formato,
      date: formatarData(apiModelo.date),
      curso: apiModelo.curso || [],
      disciplina: apiModelo.curso?.[0] || 'Disciplina não especificada',
      area: apiModelo.area || [],
      categorias: apiModelo.tipo || [],
      tipo: apiModelo.tipo || [],
      img_sm: imagemParaExibir,
      img_md: imagemParaExibir,
      img_lg: imagemParaExibir,
      descricao: limparHTML(apiModelo.descricao),
      autor: apiModelo.autoria || apiModelo.createdBy || 'Autor não informado',
      formato: apiModelo.formato,
      tecnologia: apiModelo.tecnologias || [],
      acessibilidade: apiModelo.acessibilidade || [],
      hasMobile: false,
      hasCodigo: apiModelo.hasCodigo || false,
      isDestaque: apiModelo.destaque || false,
      hasEquipe: apiModelo.hasEquipe || false,
      equipe: apiModelo.equipe ? {
        docente: apiModelo.equipe.docente || '',
        coordenacao: apiModelo.equipe.coordenacao || '',
        roteirizacao: apiModelo.equipe.roteirizacao || '',
        ilustracao: apiModelo.equipe.ilustracao || '',
        layout: apiModelo.equipe.layout || '',
        programacao: apiModelo.equipe.programacao || ''
      } : undefined,
      tags: apiModelo.tags || [],
      link: apiModelo.link || '',
      github: apiModelo.codigoLink || undefined,
      isSalvo: true, // Por definição, todos aqui são salvos
      licenca: apiModelo.licenca?.join(', ') || 'Não especificada',
      carousel: apiModelo.carousel
    };
  }

  /**
   * APLICA FILTROS E ORDENAÇÃO
   */
  aplicarFiltros(): void {
    let modelosFiltrados = [...this.modelosSalvos];

    // Filtro por texto
    if (this.filtroTexto.trim()) {
      const termo = this.filtroTexto.toLowerCase().trim();
      modelosFiltrados = modelosFiltrados.filter(modelo => 
        modelo.titulo.toLowerCase().includes(termo) ||
        (modelo.descricao && modelo.descricao.toLowerCase().includes(termo)) ||
        (modelo.tags && modelo.tags.some(tag => tag.toLowerCase().includes(termo)))
      );
    }

    // Aplica ordenação
    modelosFiltrados = this.aplicarOrdenacao(modelosFiltrados);
    this.modelosFiltrados = modelosFiltrados;

    // Atualiza paginação
    this.paginationConfig = this.paginationService.irParaPagina(1, this.paginationConfig);
    this.atualizarPaginacao();
  }

  /**
   * APLICA ORDENAÇÃO SELECIONADA
   */
  private aplicarOrdenacao(modelos: Modelo[]): Modelo[] {
    const userProfile = this.authService.getCurrentUserProfile();
    const salvosIds = userProfile?.salvos || [];

    const ordenacao = this.ordenacaoSelecionada || 'salvos-recentes';
    const modelosOrdenados = [...modelos];

    switch (ordenacao) {
      case 'salvos-recentes':
        return modelosOrdenados.sort((a, b) => {
          const indexA = salvosIds.indexOf(a.id);
          const indexB = salvosIds.indexOf(b.id);
          
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          
          return indexB - indexA; // Mais recentes primeiro
        });

      case 'salvos-antigos':
        return modelosOrdenados.sort((a, b) => {
          const indexA = salvosIds.indexOf(a.id);
          const indexB = salvosIds.indexOf(b.id);
          
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          
          return indexA - indexB; // Mais antigos primeiro
        });

      case 'alfabetica':
        return modelosOrdenados.sort((a, b) => 
          a.titulo.localeCompare(b.titulo, 'pt-BR', { sensitivity: 'base' })
        );

      case 'mais-recentes':
        return modelosOrdenados.sort((a, b) => {
          const dateA = this.converterDataParaTimestamp(a.date);
          const dateB = this.converterDataParaTimestamp(b.date);
          
          if (dateB === dateA) {
            return a.titulo.localeCompare(b.titulo, 'pt-BR', { sensitivity: 'base' });
          }
          
          return dateB - dateA;
        });

      case 'mais-antigos':
        return modelosOrdenados.sort((a, b) => {
          const dateA = this.converterDataParaTimestamp(a.date);
          const dateB = this.converterDataParaTimestamp(b.date);
          
          if (dateA === dateB) {
            return a.titulo.localeCompare(b.titulo, 'pt-BR', { sensitivity: 'base' });
          }
          
          return dateA - dateB;
        });

      default:
        return modelosOrdenados;
    }
  }

  /**
   * CONVERTE STRING DE DATA PARA TIMESTAMP
   */
  private converterDataParaTimestamp(dateString: string): number {
    const parts = dateString.split('/');
    
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).getTime();
    } else if (parts.length === 2) {
      const [month, year] = parts;
      return new Date(parseInt(year), parseInt(month) - 1, 1).getTime();
    } else if (parts.length === 1) {
      return new Date(parseInt(parts[0]), 0, 1).getTime();
    }
    
    return 0;
  }

  /**
   * ATUALIZA PAGINAÇÃO
   */
  private atualizarPaginacao(): void {
    this.paginationConfig = this.paginationService.atualizarPaginacaoComNovosItens(
      this.modelosFiltrados, 
      this.paginationConfig
    );
    this.modelosPaginados = this.paginationService.obterItensPaginados(
      this.modelosFiltrados, 
      this.paginationConfig
    );
  }

  /**
   * NAVEGAÇÃO ENTRE PÁGINAS
   */
  irParaPagina(pagina: number): void {
    this.paginationConfig = this.paginationService.irParaPagina(pagina, this.paginationConfig);
    this.atualizarModelosPaginados();
    this.rolarParaTopo();
  }

  proximaPagina(): void {
    this.paginationConfig = this.paginationService.proximaPagina(this.paginationConfig);
    this.atualizarModelosPaginados();
    this.rolarParaTopo();
  }

  paginaAnterior(): void {
    this.paginationConfig = this.paginationService.paginaAnterior(this.paginationConfig);
    this.atualizarModelosPaginados();
    this.rolarParaTopo();
  }

  irParaPrimeiraPagina(): void {
    this.paginationConfig = this.paginationService.irParaPrimeiraPagina(this.paginationConfig);
    this.atualizarModelosPaginados();
    this.rolarParaTopo();
  }

  irParaUltimaPagina(): void {
    this.paginationConfig = this.paginationService.irParaUltimaPagina(this.paginationConfig);
    this.atualizarModelosPaginados();
    this.rolarParaTopo();
  }

  /**
   * ATUALIZA MODELOS PAGINADOS
   */
  private atualizarModelosPaginados(): void {
    this.modelosPaginados = this.paginationService.obterItensPaginados(
      this.modelosFiltrados, 
      this.paginationConfig
    );
  }

  /**
   * ROLA PARA O TOPO
   */
  private rolarParaTopo(): void {
    setTimeout(() => {
      const elemento = document.querySelector('.user-bookmarks');
      if (elemento) {
        elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  }

  /**
   * NAVEGA PARA PÁGINA DO MODELO
   */
  verMaisInformacoes(modeloId: string): void {
    this.router.navigate(['/modelo', modeloId]);
  }

  /**
   * ABRE LINK DO MATERIAL
   */
  irParaMaterial(link: string | undefined): void {
    if (link) {
      window.open(link, '_blank');
    }
  }

  /**
   * REMOVE DOS SALVOS
   */
  removerDosSalvos(modeloId: string, event: Event): void {
    event.stopPropagation();
    
    this.salvosService.removerDosSalvos(modeloId).subscribe({
      next: () => {
        console.log('✅ Modelo removido dos salvos');
        // Atualiza a lista após remoção
        this.atualizarListaAposRemocao(modeloId);
      },
      error: (error) => {
        console.error('❌ Erro ao remover dos salvos:', error);
      }
    });
  }

  /**
   * ATUALIZA LISTA APÓS REMOÇÃO
   */
  private atualizarListaAposRemocao(modeloId: string): void {
    // Remove o modelo da lista local
    this.modelosSalvos = this.modelosSalvos.filter(modelo => modelo.id !== modeloId);
    this.modelosFiltrados = this.modelosFiltrados.filter(modelo => modelo.id !== modeloId);
    
    // Atualiza paginação
    this.atualizarPaginacao();
  }

  /**
   * GETTERS PARA O TEMPLATE
   */
  get paginaAtual(): number {
    return this.paginationConfig.paginaAtual;
  }

  get totalPaginas(): number {
    return this.paginationConfig.totalPaginas;
  }

  get paginasParaExibir(): number[] {
    return this.paginationConfig.paginasParaExibir;
  }
}