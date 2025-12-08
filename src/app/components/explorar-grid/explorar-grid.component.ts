import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Modelo } from '../../interfaces/modelo/modelo.interface';
import { Modeloslist } from '../../data/modelos-list';
import { BookmarkService } from '../../services/bookmark.service'; 
import { AuthService } from '../../services/auth.service';
import { CarregamentoService } from '../../services/carregamento-modelos.service';
import { PaginationService, PaginationConfig } from '../../services/pagination.service';

@Component({
  selector: 'app-explorar-grid',
  templateUrl: './explorar-grid.component.html',
  styleUrl: './explorar-grid.component.scss'
})
export class ExplorarGridComponent implements OnInit {
  @Input({required: true}) modelosList: Modelo[] = Modeloslist;

  // Propriedades Paginação
  paginationConfig!: PaginationConfig;
  modelosPaginados: Modelo[] = [];
  carregando: boolean = false;
  
  // Nova propriedade para itens por página dinâmico
  private itensPorPaginaPadrao = 9; // Para 3 cards por linha
  private itensPorPagina: number = this.itensPorPaginaPadrao;

  constructor(
      private router: Router,
      private bookmarkService: BookmarkService,
      private authService: AuthService,
      private carregamentoService: CarregamentoService,
      private paginationService: PaginationService
    ) { }

  @Output() modeloSelecionado = new EventEmitter<string>();

  @Output() paginacaoAtualizada = new EventEmitter<{
    paginaAtual: number;
    totalPaginas: number;
  }>();

  @Output() carregamentoAtualizado = new EventEmitter<boolean>();

  isLoggedIn: boolean = false;

  ngOnInit() {
    this.isLoggedIn = this.authService.isSignedIn();
    
    // Verifica tamanho da tela inicial
    this.atualizarItensPorPaginaBaseadoNaLargura();

    // INICIALIZAÇÃO SIMPLIFICADA
    this.paginationConfig = this.paginationService.inicializarPaginacao([], this.itensPorPagina);

    this.authService.isAuthenticated().subscribe(loggedIn => {
      this.isLoggedIn = loggedIn;
    });

    // Sincroniza bookmarks
    this.authService.userProfile$.subscribe(profile => {
      if (profile && this.modelosList) {
        this.sincronizarBookmarks(profile.salvos || []);
      }
    });

    // Adiciona listener para redimensionamento da tela
    window.addEventListener('resize', () => this.onResize());
  }

  // Método para atualizar itens por página baseado na largura da tela
  private atualizarItensPorPaginaBaseadoNaLargura(): void {
    const largura = window.innerWidth;
    
    if (largura < 1400 && largura >= 992) {
      // 2 cards por linha (992px-1399px) -> 8 itens por página
      this.itensPorPagina = 8;
      console.log('2 cards por linha - 8 itens por página');
    } else {
      // 3 cards por linha (≥1400px) -> 9 itens por página
      this.itensPorPagina = 9;
      console.log('3 cards por linha - 9 itens por página');
    }
  }

  // Handler para redimensionamento da tela
  @HostListener('window:resize')
  public onResize(): void {
    const larguraAnterior = this.itensPorPagina;
    this.atualizarItensPorPaginaBaseadoNaLargura();
    
    // Só recalcula se o número de itens por página mudou
    if (larguraAnterior !== this.itensPorPagina && this.modelosList.length > 0) {
      this.recalcularPaginacao();
    }
  }

  // Recalcula a paginação com o novo número de itens por página
  private recalcularPaginacao(): void {
    if (!this.carregando && this.modelosList.length > 0) {
      this.carregando = true;
      this.emitirCarregamentoAtualizado();

      setTimeout(() => {
        // Mantém a página atual se possível, ou ajusta
        const paginaAtual = this.paginationConfig.paginaAtual;
        const novoTotalPaginas = Math.ceil(this.modelosList.length / this.itensPorPagina);
        
        // Se a página atual não existe mais, vai para a primeira
        const paginaAjustada = paginaAtual <= novoTotalPaginas ? paginaAtual : 1;
        
        // Usa o serviço atualizado com parâmetro de página inicial
        this.paginationConfig = this.paginationService.inicializarPaginacao(
          this.modelosList, 
          this.itensPorPagina,
          paginaAjustada
        );
        
        this.modelosPaginados = this.paginationService.obterItensPaginados(
          this.modelosList, 
          this.paginationConfig
        );

        this.emitirPaginacaoAtualizada();
        
        this.carregando = false;
        this.emitirCarregamentoAtualizado();
      }, 300);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['modelosList']) {
      // Atualiza itens por página baseado no tamanho atual
      this.atualizarItensPorPaginaBaseadoNaLargura();
      
      // Emite que começou a carregar
      this.carregando = true;
      this.emitirCarregamentoAtualizado();

      // FORÇA a reinicialização completa quando a lista muda
      this.paginationConfig = this.paginationService.inicializarPaginacao(
        this.modelosList, 
        this.itensPorPagina
      );

      // Sincroniza bookmarks quando a lista mudar
      const currentProfile = this.authService.getCurrentUserProfile();
      if (currentProfile && currentProfile.salvos) {
        this.sincronizarBookmarks(currentProfile.salvos);
      }

      this.inicializarPagina();
    }    
  }

  // Método para sincronizar os bookmarks visuais
  private sincronizarBookmarks(idsSalvos: string[]): void {
    this.modelosList.forEach(modelo => {
      modelo.isSalvo = idsSalvos.includes(modelo.id);
    });
    
    if (this.modelosPaginados.length > 0) {
      this.modelosPaginados.forEach(modelo => {
        modelo.isSalvo = idsSalvos.includes(modelo.id);
      });
    }
  }

  /**
   * Inicializa a página carregando apenas os primeiros itens
   */
  private inicializarPagina(): void {
    this.carregando = true;
    this.emitirCarregamentoAtualizado();

    setTimeout(() => {
      // Atualiza a paginação com a lista atual
      this.paginationConfig = this.paginationService.atualizarPaginacaoComNovosItens(
        this.modelosList, 
        this.paginationConfig
      );
      
      this.modelosPaginados = this.paginationService.obterItensPaginados(
        this.modelosList, 
        this.paginationConfig
      );

      this.emitirPaginacaoAtualizada();

      this.carregando = false;
      this.emitirCarregamentoAtualizado();
    }, 1000);
  }

  // Método para emitir as informações de paginação
  private emitirPaginacaoAtualizada(): void {
    this.paginacaoAtualizada.emit({
      paginaAtual: this.paginaAtual,
      totalPaginas: this.totalPaginas
    });
  }

  // Navegação entre páginas
  irParaPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas && !this.carregando) {
      this.carregando = true;
      this.emitirCarregamentoAtualizado();
      
      this.paginationConfig = this.paginationService.irParaPagina(pagina, this.paginationConfig);
      this.modelosPaginados = this.paginationService.obterItensPaginados(
        this.modelosList, 
        this.paginationConfig
      );

      this.emitirPaginacaoAtualizada();

      setTimeout(() => {
        this.carregando = false;
        this.emitirCarregamentoAtualizado();
        this.rolarParaTopo();
      }, 1000);
    }
  }

  // Método para emitir o estado de carregamento
  private emitirCarregamentoAtualizado(): void {
    this.carregamentoAtualizado.emit(this.carregando);
  }

  proximaPagina() {
    if (this.paginaAtual < this.totalPaginas && !this.carregando) {
      this.irParaPagina(this.paginaAtual + 1);
    }
  }

  paginaAnterior() {
    if (this.paginaAtual > 1 && !this.carregando) {
      this.irParaPagina(this.paginaAtual - 1);
    }
  }

  irParaPrimeiraPagina() {
    if (!this.carregando) {
      this.irParaPagina(1);
    }
  }

  irParaUltimaPagina() {
    if (!this.carregando) {
      this.irParaPagina(this.totalPaginas);
    }
  }

  rolarParaTopo() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // MÉTODOS GETTER PARA O TEMPLATE
  get paginaAtual(): number {
    return this.paginationConfig.paginaAtual;
  }

  get totalPaginas(): number {
    return this.paginationConfig.totalPaginas;
  }

  get paginasParaExibir(): number[] {
    return this.paginationConfig.paginasParaExibir;
  }

  redirectModeloPage(id: string, event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  
    setTimeout(() => {
      this.modeloSelecionado.emit(id);
      
      this.router.navigate(['/modelo', id]).then(navigationSuccess => {
        if (!navigationSuccess) {
          console.error('Falha na navegação para o modelo', id);
          this.router.navigate(['/']);
        }
      }).catch(err => {
        console.error('Erro na navegação:', err);
      });
    }, 50);
  }

  toggleBookmark(modelo: Modelo, event: MouseEvent): void {
    event.stopPropagation();
    
    if (!this.isLoggedIn) {
      console.log('Usuário precisa estar logado para salvar modelos');
      return;
    }
  
    this.bookmarkService.toggle(modelo.id);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', () => this.onResize());
  }
}