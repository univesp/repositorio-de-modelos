import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
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
  modelosOriginais: Modelo[] = []; // Armazena modelos filtrados sem ordenação
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
    private modeloConverter: ModeloConverterService,
    private cdr: ChangeDetectorRef
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
        //console.log('Parâmetros da URL:', params);
        this.aplicarFiltrosViaUrl(params);
      });

    // Escuta mudanças diretas do serviço
    this.modoExplorarService.filtrosAtuais$
      .pipe(takeUntil(this.destroy$))
      .subscribe(filtros => {
        if (Object.keys(filtros).length === 0 && this.todosModelosDaAPI.length > 0) {
          // Se os filtros estão vazios, mostra todos os modelos
          this.modelosFiltrados = [...this.todosModelosDaAPI];
          this.modelosOriginais = [...this.todosModelosDaAPI];
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
          //console.log('Modelos carregados da API:', apiModelos.length);
          
          // Converte para o formato interno
          this.todosModelosDaAPI = this.modeloConverter.converterArrayAPIparaModelo(apiModelos);
          this.modelosOriginais = [...this.todosModelosDaAPI];
          
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
          this.cdr.detectChanges();
        },
        error: (error) => {
          //console.error('Erro ao carregar modelos da API:', error);
          this.isLoading = false;
          this.modelosFiltrados = [];
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * APLICA FILTROS VIA URL
   */
  aplicarFiltrosViaUrl(params: Params): void {
    if (this.todosModelosDaAPI.length === 0) {
      //console.log('Aguardando carregar modelos da API...');
      return;
    }

    //console.log('Aplicando filtros para:', params);
    
    // Aplica filtros nos modelos já carregados
    const modelosFiltrados = this.filtroService.aplicarFiltros(this.todosModelosDaAPI, params);
    
    // Salva os modelos filtrados originais (sem ordenação)
    this.modelosOriginais = [...modelosFiltrados];
    
    // Aplica ordenação se houver
    if (this.ordenacaoSelecionada) {
      this.modelosFiltrados = this.aplicarOrdenacaoInterna([...modelosFiltrados]);
    } else {
      this.modelosFiltrados = [...modelosFiltrados];
    }

    // Atualiza o status de salvamento
    this.atualizarStatusSalvos();

    // Atualiza os filtros ativos para exibição
    this.atualizarFiltrosAtivos(params);

    this.modoExplorarService.setModoExplorarAtivo(true);
    this.modoExplorarService.setFiltrosAtuais(params);
    
    // Força atualização da view
    this.cdr.detectChanges();
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
    if (this.ordenacaoSelecionada && this.modelosOriginais.length > 0) {
      this.modelosFiltrados = this.aplicarOrdenacaoInterna([...this.modelosOriginais]);
      this.cdr.detectChanges();
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
      'formato': 'Formato',
      'data': 'Data'
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
    if (!this.modelosOriginais || this.modelosOriginais.length === 0) {
      //console.log('Não há modelos para ordenar');
      return;
    }
    
    //console.log(`Aplicando ordenação: ${this.ordenacaoSelecionada}`);
    
    // Cria uma nova referência do array
    const novaReferencia = [...this.modelosOriginais];
    
    // Aplica a ordenação
    const modelosOrdenados = this.aplicarOrdenacaoInterna(novaReferencia);
    
    // Atribui o NOVO array (mudança de referência)
    this.modelosFiltrados = [...modelosOrdenados];
    
    // Força a detecção de mudanças
    this.cdr.detectChanges();
    
    //console.log(`Ordenação aplicada. Modelos: ${this.modelosFiltrados.length}`);
  }

  /**
   * APLICA LÓGICA DE ORDENAÇÃO INTERNA
   */
  private aplicarOrdenacaoInterna(modelos: Modelo[]): Modelo[] {
    if (!modelos || !modelos.length || !this.ordenacaoSelecionada) {
      return [...modelos];
    }
    
    const modelosCopia = [...modelos];
    
    switch (this.ordenacaoSelecionada) {
      case 'alfabetica':
        return modelosCopia.sort((a, b) => 
          a.titulo.localeCompare(b.titulo, 'pt-BR', { sensitivity: 'base' })
        );
      
      case 'recentes':
        // Ordena do MAIS RECENTE para o MAIS ANTIGO
        return modelosCopia.sort((a, b) => {
          const dataA = this.converterStringParaDate(a.date);
          const dataB = this.converterStringParaDate(b.date);
          
          // Mais recente primeiro (data B - data A)
          return dataB.getTime() - dataA.getTime();
        });
      
      case 'antigos':
        // Ordena do MAIS ANTIGO para o MAIS RECENTE
        return modelosCopia.sort((a, b) => {
          const dataA = this.converterStringParaDate(a.date);
          const dataB = this.converterStringParaDate(b.date);
          
          // Mais antigo primeiro (data A - data B)
          return dataA.getTime() - dataB.getTime();
        });
      
      default:
        return modelosCopia;
    }
  }

  /**
   * Converte string de data para objeto Date - VERSÃO ROBUSTA
   */
  private converterStringParaDate(dataStr: string): Date {
    if (!dataStr || dataStr === 'Data não disponível' || dataStr.trim() === '') {
      return new Date(0); // Retorna data muito antiga
    }
    
    try {
      // Se a data já estiver no formato ISO (vindo da API)
      if (dataStr.includes('T') && dataStr.includes('-')) {
        const data = new Date(dataStr);
        // CORREÇÃO: Compensa o fuso horário
        const dataCorrigida = new Date(data.getTime() + data.getTimezoneOffset() * 60000);
        return isNaN(dataCorrigida.getTime()) ? new Date(0) : dataCorrigida;
      }
      
      // Prepara a string removendo pontos e normalizando
      const dataLimpa = dataStr
        .toLowerCase()
        .replace(/\./g, '') // Remove todos os pontos
        .trim();
      
      // Regex para capturar data no formato de texto correto
      const match = dataLimpa.match(/(\d+)\s+de\s+(\w+)\s+de\s+(\d+)/);
      
      if (match) {
        const dia = parseInt(match[1], 10);
        const mesStr = match[2].toLowerCase();
        const ano = parseInt(match[3], 10);
        
        // Mapeia meses (suporte a abreviações com/sem ponto)
        const mesesMap: {[key: string]: number} = {
          'jan': 0, 'janeiro': 0,
          'fev': 1, 'fevereiro': 1,
          'mar': 2, 'março': 2,
          'abr': 3, 'abril': 3,
          'mai': 4, 'maio': 4,
          'jun': 5, 'junho': 5,
          'jul': 6, 'julho': 6,
          'ago': 7, 'agosto': 7,
          'set': 8, 'setembro': 8,
          'out': 9, 'outubro': 9,
          'nov': 10, 'novembro': 10,
          'dez': 11, 'dezembro': 11
        };
        
        const mes = mesesMap[mesStr] || 0;
        
        //Criar data com hora específica (12:00) para evitar problemas de fuso
        const data = new Date(ano, mes, dia, 12, 0, 0);
        return isNaN(data.getTime()) ? new Date(0) : data;
      }
      
      // Tenta parsear como data padrão do JavaScript
      const dataPadrao = new Date(dataStr);
      // CORREÇÃO: Compensa o fuso horário também aqui
      const dataCorrigida = new Date(dataPadrao.getTime() + dataPadrao.getTimezoneOffset() * 60000);
      return isNaN(dataCorrigida.getTime()) ? new Date(0) : dataCorrigida;
      
    } catch (e) {
      //console.warn(`Erro ao converter data: "${dataStr}"`, e);
      return new Date(0);
    }
  }

  /**
   * ALTERNA O TIPO DE VISUALIZAÇÃO
   * Bloqueia mudança para 'grid' em telas menores
   */
  switchViewType(type: 'grid' | 'list') {
    // Bloqueia mudança para grid em telas menores
    if (window.innerWidth < 992 && type === 'grid') {
      //console.log('Visualização grid desativada em telas menores');
      return;
    }
    
    this.viewType = type;
    localStorage.setItem('viewType', type);
    this.cdr.detectChanges();
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
      
      //console.log(`Removendo filtro ${chave}. Parâmetros restantes:`, paramsAtuais);
      
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
      //console.log(`Forçando sincronização do select: ${chaveRemovida}`);
      
      setTimeout(() => {
        this.modoExplorarService.setFiltrosAtuais(novosParams);
      }, 100);
    }
  }
}