import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Modelo } from '../../interfaces/modelo/modelo.interface';
import { BookmarkService } from '../../services/bookmark.service'; 
import { AuthService } from '../../services/auth.service';
import { CarregamentoService } from '../../services/carregamento-modelos.service';

@Component({
  selector: 'app-explorar-list',
  templateUrl: './explorar-list.component.html',
  styleUrls: ['./explorar-list.component.scss']
})
export class ExplorarListComponent implements OnInit, OnChanges {
  @Input({required: true}) modelosList: Modelo[] = [];

  // Propriedades para infinite scroll
  modelosExibidos: Modelo[] = [];
  paginaAtual: number = 1;
  carregandoMais: boolean = false;
  todosCarregados: boolean = false;

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

    this.inicializarLista();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['modelosList']) {
      this.resetarLista();
    }
  }

  /**
   * Inicializa a lista com os primeiros 9 itens
   */
  private inicializarLista(): void {
    this.paginaAtual = 1;
    this.todosCarregados = false;
    
     // Carrega apenas os primeiros 9 itens
     this.modelosExibidos = this.carregamentoService.carregarPagina(
      this.modelosList, 
      this.paginaAtual
    );

    this.todosCarregados = !this.carregamentoService.temMaisItens(
      this.modelosList, 
      this.modelosExibidos.length
    );
  }

  /**
   * Reseta a lista quando a lista principal muda
   */
  private resetarLista(): void {
    this.paginaAtual = 1;
    this.todosCarregados = false;
    this.modelosExibidos = [];
    this.inicializarLista();
  }

  /**
   * Carrega mais (até) 9 itens para a lista
   */
  carregarMaisItens(): void {
    if (this.carregandoMais || this.todosCarregados) return;

    this.carregandoMais = true;

    // Simula um delay de carregamento (remova em produção se quiser instantâneo)
    setTimeout(() => {
      this.paginaAtual++;
      
      const novosItens = this.carregamentoService.carregarPagina(
        this.modelosList, 
        this.paginaAtual
      );
      
      if (novosItens.length > 0) {
        this.modelosExibidos = [...this.modelosExibidos, ...novosItens];
        
        // Verifica se ainda há mais itens para carregar
        this.todosCarregados = !this.carregamentoService.temMaisItens(
          this.modelosList, 
          this.modelosExibidos.length
        );
      } else {
        this.todosCarregados = true;
      }
      
      this.carregandoMais = false;
    }, 2000);
  }

  /**
   * HostListener para detectar quando o usuário chega perto do final
   */
  @HostListener('window:scroll', ['$event'])
  onWindowScroll(): void {
    if (this.deveCarregarMais()) {
      this.carregarMaisItens();
    }
  }

  /**
   * Verifica se deve carregar mais itens baseado na posição do scroll
   * Verifica quando chega no 9º elemento (último da página atual)
   */
  private deveCarregarMais(): boolean {
    if (this.carregandoMais || this.todosCarregados) return false;

    // Pega o último elemento da lista atual
    const ultimoElemento = document.querySelector('.explorarList__item-container:last-child');
    if (!ultimoElemento) return false;

    const rect = ultimoElemento.getBoundingClientRect();
    const estaVisivel = rect.top <= window.innerHeight && rect.bottom >= 0;

    return estaVisivel;
  }

  /**
   * Alternativa: Carregar mais quando o último elemento estiver visível
   */
  observarUltimoElemento(elemento: HTMLElement): void {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.carregandoMais && !this.todosCarregados) {
          this.carregarMaisItens();
        }
      });
    });

    observer.observe(elemento);
  }

  redirectModeloPage(id: string) {
    this.modeloSelecionado.emit(id);
    this.router.navigate(['/modelo', id]);
  }

  toggleBookmark(modelo: Modelo, event: MouseEvent): void {
    event.stopPropagation();
    this.bookmarkService.toggle(modelo.id);
    modelo.isSalvo = this.bookmarkService.isSalvo(modelo.id);
  }
}