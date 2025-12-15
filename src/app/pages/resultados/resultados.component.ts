// resultados.component.ts
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// INTERFACES
import { Modelo } from '../../interfaces/modelo/modelo.interface';
import { ModeloAPI } from '../../interfaces/modelo/modelo-api.interface';

// SERVICES
import { ModoExplorarService } from '../../services/modo-explorar.service';
import { BookmarkService } from '../../services/bookmark.service';
import { FiltroService } from '../../services/filtro.service';
import { ApiModelosService } from '../../services/api-modelos.service';
import { ModeloConverterService } from '../../services/modelo-converter.service';

@Component({
  selector: 'app-resultados',
  templateUrl: './resultados.component.html',
  styleUrls: ['./resultados.component.scss']
})
export class ResultadosComponent implements OnInit, OnDestroy {
  todosModelosDaAPI: Modelo[] = [];
  modelosFiltrados: Modelo[] = [];
  viewType: 'grid' | 'list' = 'grid';
  opacityClicked = 1;
  ordenacaoSelecionada: string = '';
  filtrosAtivos: string[] = [];
  
  isLoading = true;
  
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private modoExplorarService: ModoExplorarService,
    private bookmarkService: BookmarkService,
    private filtroService: FiltroService,
    private apiModelosService: ApiModelosService,
    private modeloConverter: ModeloConverterService
  ) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    this.modoExplorarService.resetAll();

    // Verificar tamanho da tela primeiro
    this.checkScreenSize();

    // Só usar localStorage se for tela grande
    if (window.innerWidth >= 992) {
      const savedViewType = localStorage.getItem('viewType');
      this.viewType = savedViewType === 'list' ? 'list' : 'grid';
    } else {
      // Forçar list em telas menores
      this.viewType = 'list';
    }

    // PRIMEIRO: Carrega todos modelos da API
    this.carregarTodosModelosDaAPI();

    // DEPOIS: Escuta mudanças nos parâmetros da URL
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params: Params) => {
        console.log('🔍 Parâmetros da URL:', params);
        this.aplicarFiltrosViaUrl(params);
      });

    // Escuta mudanças diretas do serviço
    this.modoExplorarService.filtrosAtuais$
      .pipe(takeUntil(this.destroy$))
      .subscribe(filtros => {
        if (Object.keys(filtros).length === 0 && this.todosModelosDaAPI.length > 0) {
          // Se os filtros estão vazios, mostra todos os modelos
          this.modelosFiltrados = [...this.todosModelosDaAPI];
          this.atualizarStatusSalvos();
          this.aplicarOrdenacaoSeNecessaria();
          this.atualizarFiltrosAtivos({});
        }
      });

    // Adicionar listener para mudanças de tamanho
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.modoExplorarService.setModoExplorarAtivo(false);
    this.modoExplorarService.setModeloId(null);
    this.modoExplorarService.setFiltrosAtuais({});
    window.removeEventListener('resize', () => this.checkScreenSize());
  }

  /**
   * VERIFICA O TAMANHO DA TELA E AJUSTA A VISUALIZAÇÃO
   */
  checkScreenSize(): void {
    if (window.innerWidth < 992) {
      // Forçar visualização List em telas menores
      this.viewType = 'list';
    } else {
      // Em telas grandes, manter a preferência do usuário
      const savedViewType = localStorage.getItem('viewType');
      this.viewType = savedViewType === 'list' ? 'list' : 'grid';
    }
  }

  /**
   * CARREGA TODOS MODELOS DA API
   */
  private carregarTodosModelosDaAPI(): void {
    this.isLoading = true;
    
    this.apiModelosService.getModelosDaAPI()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (apiModelos: ModeloAPI[]) => {
          console.log('📦 Modelos carregados da API:', apiModelos.length);
          
          // Converte para o formato interno
          this.todosModelosDaAPI = this.modeloConverter.converterArrayAPIparaModelo(apiModelos);
          
          // Aplica filtros se houver parâmetros na URL
          const paramsAtuais = this.route.snapshot.queryParams;
          if (Object.keys(paramsAtuais).length > 0) {
            this.aplicarFiltrosViaUrl(paramsAtuais);
          } else {
            // Se não há filtros, mostra todos
            this.modelosFiltrados = [...this.todosModelosDaAPI];
            this.atualizarStatusSalvos();
            this.aplicarOrdenacaoSeNecessaria();
          }
          
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Erro ao carregar modelos da API:', error);
          this.isLoading = false;
          this.modelosFiltrados = [];
        }
      });
  }

  /**
   * APLICA FILTROS VIA URL
   */
  aplicarFiltrosViaUrl(params: Params): void {
    if (this.todosModelosDaAPI.length === 0) {
      console.log('⚠️ Aguardando carregar modelos da API...');
      return;
    }

    console.log('🎯 Aplicando filtros para:', params);
    
    // Aplica filtros nos modelos já carregados
    const modelosFiltrados = this.filtroService.aplicarFiltros(this.todosModelosDaAPI, params);
    
    // Aplica ordenação se houver
    if (this.ordenacaoSelecionada) {
      this.modelosFiltrados = this.aplicarOrdenacaoInterna(modelosFiltrados);
    } else {
      this.modelosFiltrados = modelosFiltrados;
    }

    // Atualiza o status de salvamento
    this.atualizarStatusSalvos();

    // Atualiza os filtros ativos para exibição
    this.atualizarFiltrosAtivos(params);

    this.modoExplorarService.setModoExplorarAtivo(true);
    this.modoExplorarService.setFiltrosAtuais(params);
  }

  /**
   * ATUALIZA STATUS DE SALVOS NOS MODELOS
   */
  private atualizarStatusSalvos(): void {
    this.modelosFiltrados = this.modelosFiltrados.map(modelo => ({
      ...modelo,
      isSalvo: this.bookmarkService.isSalvo(modelo.id)
    }));
  }

  /**
   * APLICA ORDENAÇÃO SE NECESSÁRIA
   */
  private aplicarOrdenacaoSeNecessaria(): void {
    if (this.ordenacaoSelecionada && this.modelosFiltrados.length > 0) {
      this.modelosFiltrados = this.aplicarOrdenacaoInterna(this.modelosFiltrados);
    }
  }

  /**
   * ATUALIZA FILTROS ATIVOS PARA EXIBIÇÃO
   */
  private atualizarFiltrosAtivos(params: Params): void {
    this.filtrosAtivos = [];
    
    const labels: { [key: string]: string } = {
      'search': 'Busca',
      'tags': 'Tag',
      'area': 'Área',
      'curso': 'Curso',
      'disciplina': 'Disciplina',
      'categorias': 'Categoria',
      'tipo': 'Tipo',
      'tecnologia': 'Tecnologia',
      'acessibilidade': 'Acessibilidade',
      'formato': 'Formato'
    };
  
    Object.entries(params).forEach(([chave, valor]) => {
      if (valor && valor !== '' && valor !== '[Selecione]' && valor !== 'null' && valor !== 'undefined') {
        const label = labels[chave] || chave;
        const textoVisual = `${label}: ${valor}`;
        this.filtrosAtivos.push(`${chave}|${textoVisual}`);
      }
    });
  }

  /**
   * APLICA ORDENAÇÃO QUANDO O SELECT É ALTERADO
   */
  aplicarOrdenacao(): void {
    if (this.modelosFiltrados.length === 0) return;
    
    this.modelosFiltrados = this.aplicarOrdenacaoInterna(this.modelosFiltrados);
  }

  /**
   * APLICA LÓGICA DE ORDENAÇÃO INTERNA
   */
  private aplicarOrdenacaoInterna(modelos: Modelo[]): Modelo[] {
    switch (this.ordenacaoSelecionada) {
      case 'alfabetica':
        return [...modelos].sort((a, b) => 
          a.titulo.localeCompare(b.titulo, 'pt-BR', { sensitivity: 'base' })
        );
      
      case 'recentes':
        // Ordena por data (mais recentes primeiro)
        return [...modelos].sort((a, b) => {
          const dateA = new Date(a.date.split('/').reverse().join('-')).getTime();
          const dateB = new Date(b.date.split('/').reverse().join('-')).getTime();
          return dateB - dateA; // Descendente (mais recente primeiro)
        });
      
      default:
        return modelos;
    }
  }

  /**
   * ALTERNA O TIPO DE VISUALIZAÇÃO
   * Bloqueia mudança para 'grid' em telas menores
   */
  switchViewType(type: 'grid' | 'list') {
    // Bloqueia mudança para grid em telas menores
    if (window.innerWidth < 992 && type === 'grid') {
      console.log('📱 Visualização grid desativada em telas menores');
      return;
    }
    
    this.viewType = type;
    localStorage.setItem('viewType', type);
  }

  abrirModelo(id: string) {
    this.modoExplorarService.setModeloId(Number(id));
    this.router.navigate(['/modelo', id]);
  }

  getTextoBadge(filtroCompleto: string): string {
    return filtroCompleto.split('|')[1];
  }

  removerFiltro(filtroCompleto: string, event: Event) {
    event.stopPropagation();
    
    const partes = filtroCompleto.split('|');
    const chave = partes[0];
    
    if (chave) {
      const paramsAtuais = { ...this.route.snapshot.queryParams };
      delete paramsAtuais[chave];
      
      console.log(`🗑️ Removendo filtro ${chave}. Parâmetros restantes:`, paramsAtuais);
      
      this.forcarSincronizacaoFilterComponent(chave, paramsAtuais);
      
      if (Object.keys(paramsAtuais).length > 0) {
        this.router.navigate(['/resultados'], {
          queryParams: paramsAtuais,
          replaceUrl: true
        });
      } else {
        this.router.navigate(['/explorar']);
      }
    }
  }

  private forcarSincronizacaoFilterComponent(chaveRemovida: string, novosParams: any) {
    this.modoExplorarService.setFiltrosAtuais(novosParams);
    
    const filtrosConhecidos = ['area', 'curso', 'disciplina', 'categorias', 'tipo', 'tecnologia', 'acessibilidade', 'formato'];
    
    if (filtrosConhecidos.includes(chaveRemovida)) {
      console.log(`🔄 Forçando sincronização do select: ${chaveRemovida}`);
      
      setTimeout(() => {
        this.modoExplorarService.setFiltrosAtuais(novosParams);
      }, 100);
    }
  }
}