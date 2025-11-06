import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
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

  constructor(
      private router: Router,
      private bookmarkService: BookmarkService,
      private authService: AuthService,
      private carregamentoService: CarregamentoService,
      private paginationService: PaginationService
    ) { }

  @Output() modeloSelecionado = new EventEmitter<string>();

    isLoggedIn: boolean = false;

  ngOnInit() {
    this.isLoggedIn = this.authService.isSignedIn();

    // INICIALIZAÇÃO SIMPLIFICADA - a paginação será tratada no ngOnChanges
    this.paginationConfig = this.paginationService.inicializarPaginacao([], 9);

    this.authService.isAuthenticated().subscribe(loggedIn => {
      this.isLoggedIn = loggedIn;
    });

    //Sincroniza o estado dos bookmarks com o perfil do usuário
    this.authService.userProfile$.subscribe(profile => {
      if (profile && this.modelosList) {
        this.sincronizarBookmarks(profile.salvos || []);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['modelosList']) {
      // FORÇA a reinicialização completa quando a lista muda
      this.paginationConfig = this.paginationService.inicializarPaginacao(
        this.modelosList, 
        9
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
    
    // Se estiver usando paginação, atualiza também os modelos paginados
    if (this.modelosPaginados.length > 0) {
      this.modelosPaginados.forEach(modelo => {
        modelo.isSalvo = idsSalvos.includes(modelo.id);
      });
    }
  }

  /**
   * Inicializa a página carregando apenas os primeiros 9 itens
   */
  private inicializarPagina(): void {
    this.carregando = true;

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

      this.carregando = false;
    }, 1000);
  }

  // Navegação entre páginas
  irParaPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas && !this.carregando) {
      this.carregando = true;
      
      this.paginationConfig = this.paginationService.irParaPagina(pagina, this.paginationConfig);
      this.modelosPaginados = this.paginationService.obterItensPaginados(
        this.modelosList, 
        this.paginationConfig
      );

      setTimeout(() => {
        this.carregando = false;
        this.rolarParaTopo();
      }, 1000);
    }
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
    // 1. Previne comportamentos padrão e propagação
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  
    // 2. Delay mínimo para garantir que outros eventos terminem
    setTimeout(() => {
      // 3. Emite o evento para o Dashboard (se necessário)
      this.modeloSelecionado.emit(id);
      
      // 4. Navegação com tratamento de erro
      this.router.navigate(['/modelo', id]).then(navigationSuccess => {
        if (!navigationSuccess) {
          console.error('Falha na navegação para o modelo', id);
          this.router.navigate(['/']); // Fallback
        }
      }).catch(err => {
        console.error('Erro na navegação:', err);
      });
    }, 50); // Delay de 50ms é seguro para conflitos de UI
  }

  toggleBookmark(modelo: Modelo, event: MouseEvent): void {
    event.stopPropagation(); // impede o clique no card
    
    // Verifica se está logado
    if (!this.isLoggedIn) {
      console.log('Usuário precisa estar logado para salvar modelos');
      return;
    }
  
    // Usa o BookmarkService atualizado
    this.bookmarkService.toggle(modelo.id);
    
  }

}
