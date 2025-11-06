import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { Modelo } from '../../interfaces/modelo/modelo.interface';
import { Modeloslist } from '../../data/modelos-list';
import { BookmarkService } from '../../services/bookmark.service'; 
import { AuthService } from '../../services/auth.service';
import { CarregamentoService } from '../../services/carregamento-modelos.service';

@Component({
  selector: 'app-explorar-grid',
  templateUrl: './explorar-grid.component.html',
  styleUrl: './explorar-grid.component.scss'
})
export class ExplorarGridComponent implements OnInit {
  @Input({required: true}) modelosList: Modelo[] = Modeloslist;

  // Propriedades Paginação
  paginaAtual: number = 1;
  modelosPaginados: Modelo[] = [];
  totalPaginas: number = 0;
  paginasParaExibir: number[] = [];
  carregando: boolean = false;

  constructor(
      private router: Router,
      private bookmarkService: BookmarkService,
      private authService: AuthService,
      private carregamentoService: CarregamentoService
    ) { }

  @Output() modeloSelecionado = new EventEmitter<string>();

    isLoggedIn: boolean = false;

  ngOnInit() {
    this.isLoggedIn = this.authService.isSignedIn();

    this.authService.isAuthenticated().subscribe(loggedIn => {
      this.isLoggedIn = loggedIn;
    });

    //Sincroniza o estado dos bookmarks com o perfil do usuário
    this.authService.userProfile$.subscribe(profile => {
      if (profile && this.modelosList) {
        this.sincronizarBookmarks(profile.salvos || []);
      }
    });

    this.inicializarPagina();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['modelosList']) {
      this.paginaAtual = 1; // Reset para primeira página quando a lista muda

      // NOVO: Sincroniza bookmarks quando a lista mudar
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
      this.calcularPaginas();
      this.atualizarModelosPaginados();
      this.carregando = false;
    }, 1000);
  }

  // Métodos de Paginação
  calcularPaginas() {
    this.totalPaginas = this.carregamentoService.getTotalPaginas(this.modelosList);
    this.atualizarPaginasParaExibir();
  }

  atualizarPaginasParaExibir() {
    const maxPaginasVisiveis = 5;
    let startPage: number;
    let endPage: number;

    if (this.totalPaginas <= maxPaginasVisiveis) {
      // Menos páginas que o máximo visível - mostra todas
      startPage = 1;
      endPage = this.totalPaginas;
    } else {
      // Mais páginas que o máximo visível - calcula o range
      const maxPagesBeforeCurrent = Math.floor(maxPaginasVisiveis / 2);
      const maxPagesAfterCurrent = Math.ceil(maxPaginasVisiveis / 2) - 1;

      if (this.paginaAtual <= maxPagesBeforeCurrent) {
        // Página atual perto do início
        startPage = 1;
        endPage = maxPaginasVisiveis;
      } else if (this.paginaAtual + maxPagesAfterCurrent >= this.totalPaginas) {
        // Página atual perto do fim
        startPage = this.totalPaginas - maxPaginasVisiveis + 1;
        endPage = this.totalPaginas;
      } else {
        // Página atual no meio
        startPage = this.paginaAtual - maxPagesBeforeCurrent;
        endPage = this.paginaAtual + maxPagesAfterCurrent;
      }
    }

    this.paginasParaExibir = Array.from(
      { length: (endPage - startPage) + 1},
      (_, i) => startPage + i
    );
  }

  /**
   * Atualiza os modelos exibidos usando o serviço
   */
  atualizarModelosPaginados() {
    this.modelosPaginados = this.carregamentoService.carregarPagina(
      this.modelosList,
      this.paginaAtual
    );

    console.log(`Grid - Página ${this.paginaAtual}: ${this.modelosPaginados.length} de ${this.modelosList.length} itens`);
  }

  // Navegação entre páginas
  irParaPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas && !this.carregando) {
      this.carregando = true;
      this.paginaAtual = pagina;

      setTimeout(() => {
        this.atualizarModelosPaginados();
        this.atualizarPaginasParaExibir();
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
    
    // ATUALIZAÇÃO: Não atualiza visualmente aqui - vai atualizar via AuthService
    // O estado será sincronizado automaticamente quando o perfil for atualizado
  }

}
