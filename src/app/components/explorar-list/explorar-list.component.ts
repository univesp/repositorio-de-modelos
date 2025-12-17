import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Modelo } from '../../interfaces/modelo/modelo.interface';
import { BookmarkService } from '../../services/bookmark.service'; 
import { AuthService } from '../../services/auth.service';
import { CarregamentoService } from '../../services/carregamento-modelos.service';
import { UploadImagemService } from '../../services/upload-imagem.service';

@Component({
  selector: 'app-explorar-list',
  templateUrl: './explorar-list.component.html',
  styleUrls: ['./explorar-list.component.scss']
})
export class ExplorarListComponent implements OnInit, OnChanges, OnDestroy {
  @Input({required: true}) modelosList: Modelo[] = [];

  // Propriedades para infinite scroll
  modelosExibidos: Modelo[] = [];
  paginaAtual: number = 1;
  carregandoMais: boolean = false;
  todosCarregados: boolean = false;

  // Cache simples de imagens
  private imagensCache = new Map<string, string>();
  // Controla quais imagens estão sendo carregadas
  private carregandoImagens = new Set<string>();

  constructor(
    private router: Router,
    private bookmarkService: BookmarkService,
    private authService: AuthService,
    private carregamentoService: CarregamentoService,
    private uploadImagemService: UploadImagemService
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
 * Retorna a imagem do cache ou inicia o carregamento
 */
  obterImagemParaModelo(modelo: Modelo): string {
    const modeloId = modelo.id;
    
    // 1. Se já tem no cache, retorna
    if (this.imagensCache.has(modeloId)) {
      return this.imagensCache.get(modeloId)!;
    }
    
    // 2. Se não está carregando, inicia o carregamento
    if (!this.carregandoImagens.has(modeloId)) {
      this.carregandoImagens.add(modeloId);
      
      this.uploadImagemService.getImagemModelo(modeloId).subscribe({
        next: (blob) => {
          // Cria URL e salva no cache
          const url = URL.createObjectURL(blob);
          this.imagensCache.set(modeloId, url);
          this.carregandoImagens.delete(modeloId);
        },
        error: (error) => {
          // Se erro, remove do set de carregamento
          this.carregandoImagens.delete(modeloId);
        }
      });
    }
    
    // 3. Enquanto carrega ou se der erro, retorna a imagem padrão
    return modelo.img_lg || 'assets/images/placeholder-modelo.svg';
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
  onWindowScroll(event: Event): void {
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

  ngOnDestroy() {
    // Limpa as URLs de blob da memória
    this.imagensCache.forEach(url => {
      URL.revokeObjectURL(url);
    });
    this.imagensCache.clear();
    this.carregandoImagens.clear();
  }
}