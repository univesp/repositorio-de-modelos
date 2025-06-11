import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

// DATA
import { Modeloslist } from '../../data/modelos-list'; // Importa a lista completa de modelos

// INTERFACES
import { Modelo } from '../../interfaces/modelo/modelo.interface';

// SERVICES
import { ModoExplorarService } from '../../services/modo-explorar.service';
import { BookmarkService } from '../../services/bookmark.service';

@Component({
  selector: 'app-explorar', // Garanta que este seletor corresponda ao usado no seu HTML
  templateUrl: './explorar.component.html',
  styleUrls: ['./explorar.component.scss']
})
export class ExplorarComponent implements OnInit, OnDestroy {

  modelosExibidos: Modelo[] = []; // Irá armazenar todos os modelos sem filtro inicial
  viewType: 'grid' | 'list' = 'grid'; // Define o tipo de visualização padrão
  opacityClicked = 1; // Para controlar a opacidade dos ícones de visualização

  constructor(
    private router: Router,
    private modoExplorarService: ModoExplorarService,
    private bookmarkService: BookmarkService
  ) {}

  ngOnInit(): void {
    // Ao iniciar, limpa qualquer estado residual do modo explorar
    this.modoExplorarService.resetAll();

    // Carrega o tipo de visualização salvo no localStorage (grid ou list)
    const savedViewType = localStorage.getItem('viewType');
    this.viewType = savedViewType === 'list' ? 'list' : 'grid';

    // Carrega todos os modelos da Modeloslist
    // Mapeia para adicionar a propriedade 'isSalvo' baseada no BookmarkService
    this.modelosExibidos = Modeloslist.map(modelo => ({
      ...modelo,
      isSalvo: this.bookmarkService.isSalvo(modelo.id)
    }));

    // Define o modo explorar como ativo e limpa filtros atuais
    this.modoExplorarService.setModoExplorarAtivo(true);
    this.modoExplorarService.setFiltrosAtuais({}); // Não há filtros aplicados nesta página inicialmente
  }

  /**
   * Alterna o tipo de visualização entre 'grid' e 'list'
   * e salva a preferência no localStorage.
   * @param type O tipo de visualização a ser definido ('grid' ou 'list').
   */
  switchViewType(type: 'grid' | 'list') {
    this.viewType = type;
    localStorage.setItem('viewType', type);
  }

  /**
   * Navega para a página de detalhes de um modelo específico.
   * @param id O ID do modelo a ser aberto.
   */
  abrirModelo(id: string) {
    const idNumber = Number(id); // Converte para número, se necessário
    this.modoExplorarService.setModeloId(idNumber); // Define o ID do modelo no serviço
    this.router.navigate(['/modelo', id]); // Navega para a rota do modelo
  }

  ngOnDestroy(): void {
    // Ao destruir o componente, define o modo explorar como inativo e limpa o ID do modelo
    this.modoExplorarService.setModoExplorarAtivo(false);
    this.modoExplorarService.setModeloId(null);
    this.modoExplorarService.setFiltrosAtuais({}); // Limpa filtros ao sair da página
  }
}
