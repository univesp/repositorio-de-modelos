import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
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

  ngOnInit(): void {
    this.filtrosSub = this.modoExplorarService.filtrosAtuais$.subscribe(filtros => {
      if (Object.keys(filtros).length === 0) {
        // Reset visual quando os filtros forem esvaziados
        this.searchTerm = '';
        this.filtrosConfig.forEach(f => {
          this.filtros[f.key] = f.placeholder;
        });
      } else {
         // ATUALIZAÇÃO: Mantém os valores visuais dos filtros que existem
        // Isso previne que filtros fiquem vazios visualmente
        for (const key in filtros) {
          if (filtros[key] && this.filtros.hasOwnProperty(key)) {
            this.filtros[key] = filtros[key];
          }
        }
      }
    });

    // Verificar dados de autenticação
    this.checkAuthStatus();

    // Obeserva mudanças no estado de autenticação
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

  private checkAuthStatus(): void {
    this.isLoggedIn = this.authService.isSignedIn();
  }

  /**
   * Verifica se há filtros ativos (diferentes do placeholder)
   */
  temFiltrosAtivos(): boolean {
    return this.filtrosConfig.some(f => 
      this.filtros[f.key] !== f.placeholder
    ) || !!this.searchTerm.trim();
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
      if (valor && valor !== placeholder) {
        filtrosValidos[chave] = valor ;
      }
    }

    // Verifica se há algum critério de busca válido
    const hasSearchTerm = !!this.searchTerm?.trim();
    const hasValidFilters = Object.keys(filtrosValidos).length > 0;

     // Mesmo sem critérios válidos, emite para recarregar todos os resultados
    //  Isso permite que quando o usuário limpar um filtro, o sistema mostre todos os modelos
    if (!hasSearchTerm && !hasValidFilters) {
      // Limpa os filtros no serviço
      this.modoExplorarService.setFiltrosAtuais({});

      // Emite filtros vazios para mostrar TODOS os resultados
      this.filtrosChanged.emit({
        filtros: {},
        searchTerm: ''
      });

      // Navega para explorar (todos os modelos)
      this.router.navigate(['/explorar']);
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
      filtros: filtrosValidos,
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
