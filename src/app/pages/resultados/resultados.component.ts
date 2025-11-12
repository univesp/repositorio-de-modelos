import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';

// DATA
import { Modeloslist } from '../../data/modelos-list';

// INTERFACES
import { Modelo } from '../../interfaces/modelo/modelo.interface';

// SERVICES
import { ModoExplorarService } from '../../services/modo-explorar.service';
import { BookmarkService } from '../../services/bookmark.service';
import { FiltroService } from '../../services/filtro.service';

@Component({
  selector: 'app-resultados',
  templateUrl: './resultados.component.html',
  styleUrls: ['./resultados.component.scss']
})
export class ResultadosComponent implements OnInit, OnDestroy {

  modelosFiltrados: Modelo[] = [];
  viewType: 'grid' | 'list' = 'grid';
  opacityClicked = 1;
  ordenacaoSelecionada: string = '';
  filtrosAtivos: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private modoExplorarService: ModoExplorarService,
    private bookmarkService: BookmarkService,
    private filtroService: FiltroService
  ) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    this.modoExplorarService.resetAll();

    const savedViewType = localStorage.getItem('viewType');
    this.viewType = savedViewType === 'list' ? 'list' : 'grid';

     // Escuta mudanças nos parâmetros da URL
    this.route.queryParams.subscribe((params: Params) => {
      this.aplicarFiltrosViaUrl(params);
    });

    // Escuta mudanças diretas do serviço (quando filtros são limpos)
    this.modoExplorarService.filtrosAtuais$.subscribe(filtros => {
      // Se os filtros estão vazios, recarrega todos os modelos
      if (Object.keys(filtros).length === 0) {
        this.carregarTodosModelos();
      }
    });
  }

  //carrega todos os modelos
  private carregarTodosModelos(): void {
    const todosModelos = Modeloslist;
    
    // Aplica ordenação se houver
    if (this.ordenacaoSelecionada) {
      this.modelosFiltrados = this.aplicarOrdenacaoInterna(todosModelos);
    } else {
      this.modelosFiltrados = todosModelos;
    }

    // Atualiza o status de salvamento
    this.modelosFiltrados = this.modelosFiltrados.map(modelo => ({
      ...modelo,
      isSalvo: this.bookmarkService.isSalvo(modelo.id)
    })) as Modelo[];
  }

  aplicarFiltrosViaUrl(params: Params): void {
    const modelosBase = Modeloslist;
    let modelosPosFiltro = this.filtroService.aplicarFiltros(modelosBase, params);

    // Aplica ordenação se houver uma selecionada
    if (this.ordenacaoSelecionada) {
      modelosPosFiltro = this.aplicarOrdenacaoInterna(modelosPosFiltro);
    }

    this.modelosFiltrados = modelosPosFiltro.map(modelo => ({
      ...modelo,
      isSalvo: this.bookmarkService.isSalvo(modelo.id)
    })) as Modelo[];

    // Atualiza os filtros ativos para exibição
    this.atualizarFiltrosAtivos(params);

    this.modoExplorarService.setModoExplorarAtivo(true);
    this.modoExplorarService.setFiltrosAtuais(params);
  }

  /**
     * Atualiza a lista de filtros ativos para exibição
     */
      /**
     * Atualiza a lista de filtros ativos para exibição nos badges
   */
  private atualizarFiltrosAtivos(params: Params): void {
    this.filtrosAtivos = [];
    
    // Mapeamento de chaves para labels mais amigáveis
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
      // Ignora valores vazios, nulos ou placeholders
      if (valor && valor !== '' && valor !== '[Selecione]' && valor !== 'null' && valor !== 'undefined') {
        const label = labels[chave] || chave;
        // Armazena no formato "chave|textoVisual" para facilitar o parsing
        const textoVisual = `${label}: ${valor}`;
        this.filtrosAtivos.push(`${chave}|${textoVisual}`);
      }
    });
  }

  /**
   * Aplica a ordenação quando o select é alterado
   */
  aplicarOrdenacao(): void {
    // Reaplica os filtros atuais com a nova ordenação
    this.route.queryParams.subscribe((params: Params) => {
      this.aplicarFiltrosViaUrl(params);
    });
  }

  /**
   * Aplica a lógica de ordenação interna
   */
  private aplicarOrdenacaoInterna(modelos: Modelo[]): Modelo[] {
    switch (this.ordenacaoSelecionada) {
      case 'alfabetica':
        return [...modelos].sort((a, b) => 
          a.titulo.localeCompare(b.titulo, 'pt-BR', { sensitivity: 'base' })
        );
      
      case 'recentes':
        // Por enquanto, retorna sem ordenação (implementaremos depois)
        console.log('Ordenação por "Mais Recentes" será implementada em breve');
        return modelos;
      
      default:
        return modelos;
    }
  }

  switchViewType(type: 'grid' | 'list') {
    this.viewType = type;
    localStorage.setItem('viewType', type);
  }

  abrirModelo(id: string) {
    const idNumber = Number(id);
    this.modoExplorarService.setModeloId(idNumber);
    this.router.navigate(['/modelo', id]);
  }

  /**
   * Extrai o texto limpo para o badge
  */
  getTextoBadge(filtroCompleto: string): string {
    // Extrai apenas a parte após o pipe "|" - que é o texto visual
    return filtroCompleto.split('|')[1];
  }

  /**
   * Remove um filtro específico
  */
  removerFiltro(filtroCompleto: string, event: Event) {
    event.stopPropagation();
    
    // Extrai a chave do formato "chave|textoVisual"
    const partes = filtroCompleto.split('|');
    const chave = partes[0];
    
    if (chave) {
      // Obtém os parâmetros atuais da URL
      const paramsAtuais = { ...this.route.snapshot.queryParams };
      
      // Remove o parâmetro específico
      delete paramsAtuais[chave];
      
      console.log(`Removendo filtro ${chave}. Parâmetros restantes:`, paramsAtuais); // DEBUG
      
      // ATUALIZAÇÃO CRÍTICA: Força a sincronização no FilterComponent
      this.forcarSincronizacaoFilterComponent(chave, paramsAtuais);
      
      // Navega para atualizar a URL
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

  /**
   * Força a sincronização do FilterComponent de forma mais agressiva
  */
  private forcarSincronizacaoFilterComponent(chaveRemovida: string, novosParams: any) {
    // 1. Atualiza o serviço - isso dispara a subscription no FilterComponent
    this.modoExplorarService.setFiltrosAtuais(novosParams);
    
    // 2. Se for um dos selects conhecidos, força um delay para garantir a sincronização
    const filtrosConhecidos = ['area', 'curso', 'disciplina', 'categorias', 'tipo', 'tecnologia', 'acessibilidade', 'formato'];
    
    if (filtrosConhecidos.includes(chaveRemovida)) {
      console.log(`Forçando sincronização do select: ${chaveRemovida}`); // DEBUG
      
      // Pequeno delay para garantir que o FilterComponent processou a mudança
      setTimeout(() => {
        // Força uma nova atualização para garantir
        this.modoExplorarService.setFiltrosAtuais(novosParams);
      }, 100);
    }
  }

  ngOnDestroy(): void {
    this.modoExplorarService.setModoExplorarAtivo(false);
    this.modoExplorarService.setModeloId(null);
    this.modoExplorarService.setFiltrosAtuais({});
  }
}