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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private modoExplorarService: ModoExplorarService,
    private bookmarkService: BookmarkService,
    private filtroService: FiltroService
  ) {}

  ngOnInit(): void {
    // Adicione esta linha no início para limpar qualquer estado residual
    this.modoExplorarService.resetAll();

    const savedViewType = localStorage.getItem('viewType');
    this.viewType = savedViewType === 'list' ? 'list' : 'grid';

    this.route.queryParams.subscribe((params: Params) => {
      
        this.aplicarFiltrosViaUrl(params);
      
    });
  }

  aplicarFiltrosViaUrl(params: Params): void {
    // Primeiro, aplica os filtros usando o FiltroService
    // Passa a lista original de modelos e os parâmetros da URL como filtros
    const modelosBase = Modeloslist; // A lista completa de modelos
    const modelosPosFiltro = this.filtroService.aplicarFiltros(modelosBase, params);

    // Em seguida, mapeia para adicionar o status de 'isSalvo'
    this.modelosFiltrados = modelosPosFiltro.map(modelo => ({
      ...modelo,
      isSalvo: this.bookmarkService.isSalvo(modelo.id)
    }));

    // Define o modo explorar ativo e os filtros atuais no serviço ModoExplorarService
    this.modoExplorarService.setModoExplorarAtivo(true);
    this.modoExplorarService.setFiltrosAtuais(params);
  }

  switchViewType(type: 'grid' | 'list') {
    this.viewType = type;
    localStorage.setItem('viewType', type);
  }

  abrirModelo(id: string) {
    // Converte para number se necessário (ajuste conforme seu service)
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