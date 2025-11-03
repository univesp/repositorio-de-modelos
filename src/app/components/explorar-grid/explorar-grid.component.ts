import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { Modelo } from '../../interfaces/modelo/modelo.interface';
import { Modeloslist } from '../../data/modelos-list';
import { BookmarkService } from '../../services/bookmark.service'; 
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-explorar-grid',
  templateUrl: './explorar-grid.component.html',
  styleUrl: './explorar-grid.component.scss'
})
export class ExplorarGridComponent implements OnInit {
  @Input({required: true}) modelosList: Modelo[] = Modeloslist;

  // Propriedades Paginação
  paginaAtual: number = 1;
  itensPorPagina: number = 9;
  modelosPaginados: Modelo[] = [];
  totalPaginas: number = 0;
  paginasParaExibir: number[] = [];

  constructor(
      private router: Router,
      private bookmarkService: BookmarkService,
      private authService: AuthService
    ) { }

  @Output() modeloSelecionado = new EventEmitter<string>();

    isLoggedIn: boolean = false;

  ngOnInit() {
    this.isLoggedIn = this.authService.isSignedIn();

    this.authService.isAuthenticated().subscribe(loggedIn => {
      this.isLoggedIn = loggedIn;
    });

    this.calcularPaginas();
    this.atualizarModelosPaginados();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['modelosList']) {
      this.paginaAtual = 1; // Reset para primeira página quando a lista muda
      this.calcularPaginas();
      this.atualizarModelosPaginados();
    }    
  }

  // Métodos de Paginação
  calcularPaginas() {
    this.totalPaginas = Math.ceil(this.modelosList.length / this.itensPorPagina);
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

  atualizarModelosPaginados() {
    const startIndex = (this.paginaAtual - 1) * this.itensPorPagina;
    const endIndex = startIndex + this.itensPorPagina;
    this.modelosPaginados = this.modelosList.slice(startIndex, endIndex);
  }

  // Navegação entre páginas
  irParaPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaAtual = pagina;
      this.atualizarModelosPaginados();
      this.atualizarPaginasParaExibir();
      this.rolarParaTopo();
    }
  }

  proximaPagina() {
    if (this.paginaAtual < this.totalPaginas) {
      this.irParaPagina(this.paginaAtual + 1);
    }
  }

  paginaAnterior() {
    if (this.paginaAtual > 1) {
      this.irParaPagina(this.paginaAtual - 1);
    }
  }

  irParaPrimeiraPagina() {
    this.irParaPagina(1);
  }

  irParaUltimaPagina() {
    this.irParaPagina(this.totalPaginas);
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
    this.bookmarkService.toggle(modelo.id); // salva ou remove do localStorage
    modelo.isSalvo = this.bookmarkService.isSalvo(modelo.id); // atualiza visual
  }

}
