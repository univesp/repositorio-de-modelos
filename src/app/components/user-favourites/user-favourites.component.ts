// components/user-favourites/user-favourites.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Modelo } from '../../interfaces/modelo/modelo.interface';
import { ModeloAPI } from '../../interfaces/modelo/modelo-api.interface';
import { SalvosService } from '../../services/salvos.service';
import { AuthService } from '../../services/auth.service';
import { PaginationService, PaginationConfig } from '../../services/pagination.service';
import { ApiModelosService } from '../../services/api-modelos.service';
import { ImagemDefaultUtils } from '../../utils/imagem-default.utils';

@Component({
  selector: 'app-user-favourites',
  templateUrl: './user-favourites.component.html',
  styleUrls: ['./user-favourites.component.scss']
})
export class UserFavouritesComponent implements OnInit, OnDestroy {
  // Arrays de dados
  todosModelosDaAPI: Modelo[] = [];
  modelosSalvos: Modelo[] = [];
  modelosFiltrados: Modelo[] = [];
  modelosPaginados: Modelo[] = [];

  // Filtros
  filtroTexto: string = '';
  ordenacaoSelecionada: string = 'salvos-recentes';

  // Propriedades de paginação
  paginationConfig!: PaginationConfig;
  isLoading = true;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private salvosService: SalvosService,
    public authService: AuthService,
    private paginationService: PaginationService,
    private apiModelosService: ApiModelosService
  ) {}

  ngOnInit(): void {
    // Inicializa a configuração de paginação
    this.paginationConfig = this.paginationService.inicializarPaginacao([], 5);
    
    // Carrega os modelos salvos
    this.carregarModelosSalvos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
      licenca: apiModelo.licenca?.join(', ') || 'Não especificada'
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