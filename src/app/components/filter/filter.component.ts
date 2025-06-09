import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { FilterConfigList } from '../../data/filterConfig-list'; 
import { FiltroConfig } from '../../interfaces/filter/filterConfig.interface';
import { ModoExplorarService } from '../../services/modo-explorar.service';

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss'
})
export class FilterComponent implements OnInit, OnDestroy {

  filtrosSub!: Subscription;

  ngOnInit(): void {
    this.filtrosSub = this.modoExplorarService.filtrosAtuais$.subscribe(filtros => {
      if (Object.keys(filtros).length === 0) {
        // Reset visual quando os filtros forem esvaziados
        this.searchTerm = '';
        this.filtrosConfig.forEach(f => {
          this.filtros[f.key] = f.placeholder;
        });
      }
    });
  }
  
  ngOnDestroy(): void {
    this.filtrosSub?.unsubscribe();
  }
  

  // Cria um "evento de saída" para comunicar mudanças para o componente pai (dashboard)
  @Output() filtrosChanged = new EventEmitter<{

    filtros: { [key: string]: string },  // Objeto com os filtros atuais
    searchTerm: string                  // Texto digitado no campo de busca

  }>();

  @Output() explorarClicked = new EventEmitter<void>();

  // Variável que armazena o que o usuário digitou no campo de busca
  searchTerm: string = '';

   // Objeto onde cada chave é o nome do filtro e o valor é o item selecionado
  filtros: { [key: string]: string } = {};

  // Array com as configurações dos filtros (rótulo, chave, placeholder e opções)
  filtrosConfig: FiltroConfig[] = FilterConfigList;

  constructor(
        private router: Router,
        private route: ActivatedRoute,
        private modoExplorarService: ModoExplorarService
      ) {
    
    const filtrosSalvos = this.modoExplorarService.getFiltrosAtuais();
    this.filtrosConfig.forEach(f => {
      const valorSalvo = filtrosSalvos[f.key];
      this.filtros[f.key] = valorSalvo && valorSalvo.trim() !== '' ? valorSalvo : f.placeholder;
    });

    // Escuta reset vindo da dashboard
    window.addEventListener('resetFiltros', () => {
     this.resetarFiltros();
    });

    // 🔥 NOVO: Pega filtros da URL (útil após reload ou acesso direto à rota com parâmetros)
    this.route.queryParams.subscribe(params => {
      this.filtrosConfig.forEach(f => {
        const valor = params[f.key];
        if (valor) {
          this.filtros[f.key] = valor;
        }
      });

    // Atualiza também no serviço global para manter sincronizado
      this.modoExplorarService.setFiltrosAtuais(this.filtros);
    });
  }

  handleExplorar() {
    this.searchTerm = '';  // Limpa a busca
    this.filtrosConfig.forEach(f => {
      this.filtros[f.key] = f.placeholder;
    });

    this.emitirMudancas();  // dispara os valores limpos
    this.explorarClicked.emit();  // comunica ao componente pai
  }

  // Limpa o texto da busca e emite as mudanças para o componente pai
  clearSearch() {
    this.searchTerm = '';
    this.emitirMudancas();  // Após limpar, avisa que algo mudou
  }

  // Função que emite o evento para o componente pai com os filtros e busca atualizados
  emitirMudancas() {
    const filtrosValidos: { [key: string]: string } = {};
  
    // Verifica filtros válidos
    for (const chave in this.filtros) {
      const valor = this.filtros[chave];
      if (valor && valor !== this.getPlaceholder(chave)) {
        filtrosValidos[chave] = valor;
      }
    }

    // Verifica se há algum critério de busca válido
    const hasSearchTerm = !!this.searchTerm?.trim();
    const hasValidFilters = Object.keys(filtrosValidos).length > 0;

     // Se não há critérios válidos, não faz nada
    if (!hasSearchTerm && !hasValidFilters) {
      return;
    }

    // Prepara os parâmetros da URL
    const queryParams = {
      ...filtrosValidos,
      ...(hasSearchTerm ? { search: this.searchTerm.trim() } : {})
    };

    this.modoExplorarService.setFiltrosAtuais(this.filtros);

    // Emite os dados para o componente pai
    this.filtrosChanged.emit({
      filtros: this.filtros,
      searchTerm: this.searchTerm
    });

    // Lógica de navegação
    if (this.router.url.startsWith('/resultados')) {
      this.router.navigate([], {
        queryParams: queryParams,
        queryParamsHandling: 'merge',
      });
    } else {
      this.router.navigate(['/resultados'], { queryParams: queryParams });
    }
  }
  

   // Chame este método ao alterar algum filtro individualmente
   onFiltroChange() {
    this.emitirMudancas();
  }

  // Detecta se estamos na página de um modelo e redireciona para Resultados ativando modoExplorar
  private voltarParaHomeSeEstiverNoModelo() {
    if (this.router.url.startsWith('/modelo/')) {
      this.modoExplorarService.setModoExplorarAtivo(true);
      this.modoExplorarService.setFiltrosAtuais(this.filtros);
  
      const filtrosValidos: { [key: string]: string } = {};
      for (const chave in this.filtros) {
        const valor = this.filtros[chave];
        if (valor && valor !== this.getPlaceholder(chave)) {
          filtrosValidos[chave] = valor;
        }
      }
  
      this.router.navigate(['/resultados'], { queryParams: filtrosValidos });
    }
  }

  private getPlaceholder(chave: string): string {
    const filtro = this.filtrosConfig.find(f => f.key === chave);
    return filtro ? filtro.placeholder : '';
  }

  resetarFiltros() {
    this.searchTerm = '';
    this.filtrosConfig.forEach(f => {
      this.filtros[f.key] = f.placeholder;
    });
    this.emitirMudancas();
  }
  
}
