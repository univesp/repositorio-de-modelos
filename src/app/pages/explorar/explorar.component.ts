import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

// DATA
import { Modeloslist } from '../../data/modelos-list';

// INTERFACES
import { Modelo } from '../../interfaces/modelo/modelo.interface';

// SERVICES
import { ModoExplorarService } from '../../services/modo-explorar.service';
import { BookmarkService } from '../../services/bookmark.service';

@Component({
  selector: 'app-explorar',
  templateUrl: './explorar.component.html',
  styleUrls: ['./explorar.component.scss']
})
export class ExplorarComponent implements OnInit, OnDestroy {

  modelosExibidos: Modelo[] = [];
  viewType: 'grid' | 'list' = 'grid';
  opacityClicked = 1;
  ordenacaoSelecionada: string = '';

  constructor(
    private router: Router,
    private modoExplorarService: ModoExplorarService,
    private bookmarkService: BookmarkService
  ) {}

  ngOnInit(): void {
    this.modoExplorarService.resetAll();

    const savedViewType = localStorage.getItem('viewType');
    this.viewType = savedViewType === 'list' ? 'list' : 'grid';

    this.carregarModelos();
  }

  /**
   * Carrega e aplica a ordenação nos modelos
   */
  private carregarModelos(): void {
    // Primeiro cria a lista base com a propriedade isSalvo
    const modelosComBookmark = Modeloslist.map(modelo => ({
      ...modelo,
      isSalvo: this.bookmarkService.isSalvo(modelo.id)
    })) as Modelo[]; // ← FORÇA A TIPAGEM AQUI

    // Aplica ordenação se houver uma selecionada
    let modelosOrdenados = modelosComBookmark;
    
    if (this.ordenacaoSelecionada) {
      modelosOrdenados = this.aplicarOrdenacaoInterna(modelosComBookmark);
    }

    this.modelosExibidos = modelosOrdenados;
  }

  /**
   * Aplica a ordenação quando o select é alterado
   */
  aplicarOrdenacao(): void {
    this.carregarModelos();
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

  /**
   * Alterna o tipo de visualização entre 'grid' e 'list'
   */
  switchViewType(type: 'grid' | 'list') {
    this.viewType = type;
    localStorage.setItem('viewType', type);
  }

  /**
   * Navega para a página de detalhes de um modelo específico.
   */
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