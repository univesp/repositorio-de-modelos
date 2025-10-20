import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

// UTILS
import { isSignedIn } from '../../utils/get-signedin'; 

// IMTERFACES
import { Modelo } from '../../interfaces/modelo/modelo.interface';

// DATA
import { Modeloslist } from '../../data/modelos-list'; 
import { FilterConfigList } from '../../data/filterConfig-list'; 

// SERVICES
import { BookmarkService } from '../../services/bookmark.service';
import { ModoExplorarService } from '../../services/modo-explorar.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  modelos: Modelo[] = [];
  modelosFiltrados: Modelo[] = [];

  isPrivate: boolean = true;
  modoExplorarAtivo: boolean = false;

  viewType: 'grid' | 'list' = 'grid'; // tipo de visualização. começa com 'grid'
  opacityClicked: number = 1;

  constructor(
      private router: Router,
      private bookmarkService: BookmarkService,
      private modoExplorarService: ModoExplorarService
    )
  { }

  ngOnInit(): void {
   // if(this.isPrivate && !isSignedIn()) {
    //  this.router.navigate(['login']);
   // }

    this.modelos = Modeloslist.map(modelo => ({
      ...modelo,
      isSalvo: this.bookmarkService.isSalvo(modelo.id)
    }));

    // Inicializa o tipo de visualização do localStorage (se houver)
    const savedViewType = localStorage.getItem('viewType');
    this.viewType = savedViewType === 'list' ? 'list' : 'grid';

    this.modelosFiltrados = [...this.modelos]; // inicializa com todos

    // Observa mudanças de estado em tempo real
    this.modoExplorarService.modoExplorarAtivo$.subscribe(ativo => {
      this.modoExplorarAtivo = ativo;
    });

    // Detecta retorno à Home vindo de Resultados ou Modelo via breadcrumb
    this.router.events
    .pipe(filter(event => event instanceof NavigationEnd))
    .subscribe((event) => {
      const navEnd = event as NavigationEnd;
      if (navEnd.urlAfterRedirects === '/') {
        const filtrosAtivos = this.modoExplorarService.getFiltrosAtuais();
        const searchTerm = filtrosAtivos['search'] || '';
        const algumSelectAlterado = Object.keys(filtrosAtivos).some(
          key => key !== 'search' && filtrosAtivos[key] !== this.getFiltroPlaceholder(key)
        );

        // Ativa modo explorar se houver busca OU select alterado
        if (searchTerm.trim() !== '' || algumSelectAlterado) {
          this.modoExplorarAtivo = true;
          this.modoExplorarService.setModoExplorarAtivo(true);
          this.modelosFiltrados = [...this.modelos]; // Mostra todos
        } else {
          this.resetFiltrosDashboard(); // Só reseta se não houver filtros
        }
      }
    });

    // Se estava em um modelo individual, ativa o modoExplorar
    const modeloId = this.modoExplorarService.getModeloId();
    if (modeloId !== null) {
      this.modoExplorarService.setModoExplorarAtivo(true);
      this.modoExplorarService.setModeloId(null);
    }

    // Verifica se há filtros ativos AO INICIAR (ex: voltando de /modelo/id)
    const filtrosAtivos = this.modoExplorarService.getFiltrosAtuais();
    const possuiFiltros = Object.values(filtrosAtivos).some(v => v && v.trim() !== '');

    if (possuiFiltros) {
      this.modoExplorarAtivo = true;
      this.modoExplorarService.setModoExplorarAtivo(true);
      this.modelosFiltrados = this.aplicarFiltros(filtrosAtivos); // Filtra os modelos
    }
  }

  // Quando filtros são alterados no <app-filter>, essa função é chamada
  onFiltrosChanged(dados: { filtros: { [key: string]: string }, searchTerm: string }) {
    const queryParams: any = {};
  
    // Monta os filtros ativos como query params
    for (const [key, value] of Object.entries(dados.filtros)) {
      const placeholder = this.getFiltroPlaceholder(key);
      if (value && value.trim() !== '' && value !== placeholder) {
        queryParams[key] = value;
      }
    }
  
    if (dados.searchTerm.trim() !== '') {
      queryParams.search = dados.searchTerm.trim();
    }
  
    // Navega para a rota de resultados com os filtros aplicados na URL
    this.router.navigate(['/resultados'], { queryParams });
  }  

  private aplicarFiltros(filtros: { [key: string]: string }): Modelo[] {
    // Apenas retorna TODOS os modelos, independente do filtro (por enquanto)
    return [...this.modelos]; // Ou this.modelosFiltrados = this.modelos;
  }

  // Recupera o placeholder original de um filtro com base na key
  getFiltroPlaceholder(key: string): string {
    const filtro = FilterConfigList.find(f => f.key === key);
    return filtro?.placeholder || '';
  }

  // Alterna visualização grid/lista
  switchViewType(type: 'grid' | 'list') {
    this.viewType = type;
    localStorage.setItem('viewType', type);
  }

  resetFiltrosDashboard() {
    this.modoExplorarService.setModoExplorarAtivo(false)
    this.modoExplorarAtivo = false;
    this.modelosFiltrados = [...this.modelos];

    //  Limpa os filtros salvos no serviço (reset lógico)
    this.modoExplorarService.setFiltrosAtuais({});

    // Força reset visual dos filtros no componente filho
    setTimeout(() => {
     const resetEvent = new CustomEvent('resetFiltros');
     window.dispatchEvent(resetEvent);
   }, 0);
  }

  async abrirModelo(id: any) {
    // 1. Força reset completo
    this.resetFiltrosDashboard();
    
    // 2. Espera o ciclo de detecção de mudanças
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // 3. Navega para o modelo
    this.router.navigate(['/modelo', id]);
    
    // 4. Limpeza adicional (opcional)
    this.modoExplorarService.setModeloId(null);
  }

}
