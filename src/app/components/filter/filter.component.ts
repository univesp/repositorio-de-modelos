import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Modeloslist } from '../../data/modelos-list';
import { FilterConfigList } from '../../data/filterConfig-list'; 
import { FiltroConfig } from '../../interfaces/filter/filterConfig.interface';
import { ModoExplorarService } from '../../services/modo-explorar.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss'
})
export class FilterComponent implements OnInit, OnDestroy {

  filtrosSub!: Subscription;
  authSub!: Subscription;

  isLoggedIn: boolean = false;

  qtdeModelos: number = Modeloslist.length;

  filtrosAbertos = false;

  ngOnInit(): void {
    // ESCUTA MUDANÇAS NO SERVIÇO E NA URL SIMULTANEAMENTE
    this.filtrosSub = this.modoExplorarService.filtrosAtuais$.subscribe(filtros => {
      //console.log('FilterComponent: Filtros atualizados via serviço', filtros); // DEBUG
      
      // SINCRONIZAÇÃO MELHORADA: Atualiza todos os selects baseado nos filtros atuais
      this.filtrosConfig.forEach(f => {
        const valorNoServico = filtros[f.key];
        
        if (valorNoServico && valorNoServico.trim() !== '' && valorNoServico !== f.placeholder) {
          // Se há um valor válido no serviço, atualiza o select
          this.filtros[f.key] = valorNoServico;
        } else {
          // Se não há valor ou foi removido, volta para o placeholder
          this.filtros[f.key] = f.placeholder;
        }
      });
      
      // Também sincroniza o searchTerm
      this.searchTerm = filtros['search'] || '';
    });
  
    // ESCUTA MUDANÇAS DIRETAS NA URL (backup)
    this.route.queryParams.subscribe(params => {
      //console.log('FilterComponent: Parâmetros da URL atualizados', params); // DEBUG
      this.sincronizarComUrl(params);
    });
  
    // Verificar dados de autenticação
    this.checkAuthStatus();
  
    // Observa mudanças no estado de autenticação
    this.authSub = this.authService.isAuthenticated().subscribe(isAuthenticated => {
      this.isLoggedIn = isAuthenticated;
    });
  }
  
  
  ngOnDestroy(): void {
    this.filtrosSub?.unsubscribe();
    this.authSub?.unsubscribe();
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
        private modoExplorarService: ModoExplorarService,
        private authService: AuthService
      ) {

        // INICIALIZA TODOS OS FILTROS COM PLACEHOLDER PRIMEIRO
        this.filtrosConfig.forEach(f => {
          this.filtros[f.key] = f.placeholder;
        });
          
        // SÓ incializa filtros se não estiver na home
        if (!this.router.url.startsWith('/')) {
          const filtrosSalvos = this.modoExplorarService.getFiltrosAtuais();
          this.filtrosConfig.forEach(f => {
            const valorSalvo = filtrosSalvos[f.key];
            // Só sobrescreve se tiver um valor salvo válido
            if (valorSalvo && valorSalvo.trim() !== '' && valorSalvo !== f.placeholder) {
              this.filtros[f.key] = valorSalvo;
            }
          });
        }
   
    

    // Escuta reset vindo da dashboard
    //window.addEventListener('resetFiltros', () => {
     //this.resetarFiltros();
   // });

    //  Lê parâmetros da URL e converte de volta para o valor visual correto
    if (!this.router.url.startsWith('/')) {
      this.route.queryParams.subscribe(params => {
        this.filtrosConfig.forEach(f => {
          const valorNormalizado = params[f.key];
          if (valorNormalizado) {
            const original = f.opcoes?.find(opcao =>
              opcao === valorNormalizado
            );
            if (original) {
              this.filtros[f.key] = original;
            }
          }
        });
  
        this.modoExplorarService.setFiltrosAtuais(this.filtros);
      });
    } 
  }

  /**
   * Sincroniza os selects com os parâmetros da URL
  */
  private sincronizarComUrl(params: any) {
    this.filtrosConfig.forEach(f => {
      const valorNaUrl = params[f.key];
      
      if (valorNaUrl && valorNaUrl.trim() !== '' && valorNaUrl !== f.placeholder) {
        this.filtros[f.key] = valorNaUrl;
      } else {
        this.filtros[f.key] = f.placeholder;
      }
    });
    
    // Sincroniza o searchTerm
    this.searchTerm = params['search'] || '';
  }

  private checkAuthStatus(): void {
    this.isLoggedIn = this.authService.isSignedIn();
  }

  /**
   * Verifica se há filtros ativos (diferentes do placeholder) OU parâmetros na URL
   */
  temFiltrosAtivos(): boolean {
    // Verifica filtros visuais ativos
    const filtrosVisuaisAtivos = this.filtrosConfig.some(f => 
      this.filtros[f.key] !== f.placeholder
    ) || !!this.searchTerm.trim();
  
    // Verifica se há parâmetros na URL (como tags)
    const paramsAtuais = this.route.snapshot.queryParams;
    const parametrosUrlAtivos = Object.keys(paramsAtuais).length > 0;
  
    return filtrosVisuaisAtivos || parametrosUrlAtivos;
  }

  /**
   * Limpa TODOS os filtros e redireciona para Explorar
   */
  limparTodosFiltros(): void {
    this.searchTerm = '';
    this.filtrosConfig.forEach(f => {
      this.filtros[f.key] = f.placeholder;
    });

    // Limpa os filtros no serviço
    this.modoExplorarService.setFiltrosAtuais({});

    // Emite evento informando que os filtros foram limpos
    this.filtrosChanged.emit({
      filtros: {},
      searchTerm: ''
    });

    // Redireciona para a página Explorar (mostra todos os modelos)
    this.router.navigate(['/explorar']);
  }

  handleExplorar() {
    // Só executa se NÃO estiver na página Explorar
    if (!this.router.url.startsWith('/explorar')) {
      this.searchTerm = '';  // Limpa a busca
      this.filtrosConfig.forEach(f => {
        this.filtros[f.key] = f.placeholder;
      });
    }

    this.emitirMudancas();  // dispara os valores limpos
    this.explorarClicked.emit();  // comunica ao componente pai
    this.router.navigate(['/explorar'])
  }

  handleTags() {
    // Só executa se NÃO estiver na página Tags
    if (!this.router.url.startsWith('/tags')) {
      this.searchTerm = '';  // Limpa a busca
      this.filtrosConfig.forEach(f => {
        this.filtros[f.key] = f.placeholder;
      });
    }

    this.emitirMudancas();  // dispara os valores limpos
    this.explorarClicked.emit();  // comunica ao componente pai
    this.router.navigate(['/tags'])
  }

  handleCadastro() {
    this.router.navigate(['/cadastro-novo-modelo'])
  }

  // Limpa o texto da busca e emite as mudanças para o componente pai
  clearSearch() {
    this.searchTerm = '';
    this.emitirMudancas();  // Após limpar, avisa que algo mudou
  }

  // Função que emite o evento para o componente pai com os filtros e busca atualizados
  emitirMudancas() {
    const filtrosValidos: { [key: string]: string } = {};

    // Verifica filtros válidos e detecta quando foi limpo
    for (const chave in this.filtros) {
      const valor = this.filtros[chave];
      const placeholder = this.getPlaceholder(chave);

      // Se o valor é diferente do placeholder [Selecione], inclui nos filtros válidos
      if (valor && valor !== placeholder && valor.trim() !== '') {
        filtrosValidos[chave] = valor;
      }
    }

    // Verifica se há algum critério de busca válido
    const hasSearchTerm = !!this.searchTerm?.trim();
    const hasValidFilters = Object.keys(filtrosValidos).length > 0;

    // Mesmo sem critérios válidos, emite para recarregar todos os resultados
    if (!hasSearchTerm && !hasValidFilters) {
      // Limpa os filtros no serviço
      this.modoExplorarService.setFiltrosAtuais({});

      // Emite filtros vazios para mostrar TODOS os resultados
      this.filtrosChanged.emit({
        filtros: {},
        searchTerm: ''
      });

      // Navega para explorar (todos os modelos) - SEM parâmetros
      this.router.navigate(['/explorar']);
      return;
    }

    // CORREÇÃO: Obter parâmetros atuais da URL
    const paramsAtuais = { ...this.route.snapshot.queryParams };
    
    // Remove parâmetros que correspondem aos nossos filtros (para evitar duplicação)
    // Isso garante que quando um filtro é limpo, ele seja removido da URL
    this.filtrosConfig.forEach(filtro => {
      if (filtrosValidos[filtro.key] === undefined) {
        // Se o filtro não está nos válidos, remove da URL
        delete paramsAtuais[filtro.key];
      }
    });

    // Também remove 'search' se não há termo de busca
    if (!hasSearchTerm) {
      delete paramsAtuais['search'];
    }

    // Combina todos os parâmetros
    const queryParams = {
      ...paramsAtuais, // Parâmetros existentes (tags, etc.)
      ...filtrosValidos, // Novos filtros dos selects
      ...(hasSearchTerm ? { search: this.searchTerm.trim() } : {}) // Termo de busca
    };

    this.modoExplorarService.setFiltrosAtuais(queryParams);

    // Emite os dados para o componente pai
    this.filtrosChanged.emit({
      filtros: queryParams,
      searchTerm: this.searchTerm
    });

    // Navega para resultados com todos os parâmetros
    this.router.navigate(['/resultados'], { 
      queryParams: queryParams
    });
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

  // Método para formatar o texto do placeholder
  getTextoPlaceholder(): string {
    const total = this.qtdeModelos;
    
    // Regra 1: Se for 5 ou menos
    if (total <= 5) {
      return `Explore ${total} modelo${total !== 1 ? 's' : ''} disponível${total !== 1 ? 's' : ''}`;
    }
    
    // Regra 2: Se for exatamente 100
    if (total === 100) {
      return 'Explore mais de 100 modelos disponíveis...';
    }
    
    // Regra 3: Se for menor que 100 (arredonda para baixo de 5 em 5)
    if (total < 100) {
      const arredondado = Math.floor((total - 1) / 5) * 5;
      return `Explore mais de ${arredondado} modelos disponíveis...`;
    }
    
    // Regra 4: Se for mais de 100 (arredonda para baixo de 50 em 50)
    const arredondado = Math.floor((total - 1) / 50) * 50;
    return `Explore mais de ${arredondado} modelos disponíveis...`;
  }

  // Detecta se está em view mobile
  isMobileView(): boolean {
    return window.innerWidth <= 575;
  }
  
  // Alterna estado dos filtros
  toggleFiltros(): void {
    this.filtrosAbertos = !this.filtrosAbertos;
  }
  
}
