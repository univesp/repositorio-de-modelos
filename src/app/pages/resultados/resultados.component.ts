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
  ordenacaoSelecionada: string = ''; // Nova propriedade para o select

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private modoExplorarService: ModoExplorarService,
    private bookmarkService: BookmarkService,
    private filtroService: FiltroService
  ) {}

  ngOnInit(): void {
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

    this.modoExplorarService.setModoExplorarAtivo(true);
    this.modoExplorarService.setFiltrosAtuais(params);
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

  ngOnDestroy(): void {
    this.modoExplorarService.setModoExplorarAtivo(false);
    this.modoExplorarService.setModeloId(null);
    this.modoExplorarService.setFiltrosAtuais({});
  }
}