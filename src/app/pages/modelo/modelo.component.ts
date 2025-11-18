import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Modelo } from '../../interfaces/modelo/modelo.interface';
import { Modeloslist } from '../../data/modelos-list';
import { BookmarkService } from '../../services/bookmark.service';
import { ModoExplorarService } from '../../services/modo-explorar.service';
import { AuthService } from '../../services/auth.service';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
    selector: 'app-modelo',
    templateUrl: './modelo.component.html',
    styleUrl: './modelo.component.scss'
})
export class ModeloComponent implements OnInit, OnDestroy {
    modelosList: Modelo[] = Modeloslist;
    possibleIds: any = [];
    currentModelo: any = [];
    modelosSimilares: any[] = [];
    private destroy$ = new Subject<void>();
    modalAberto: boolean = false;
    imagemModal: string = '';

    isLoggedIn: boolean = false;

    // Variável para controlar a abertura do menu
    menuOpcoesAberto: boolean = false;
    
    constructor(
            private router: Router,
            private route: ActivatedRoute,
            private bookmarkService: BookmarkService,
            private modoExplorarService: ModoExplorarService,
            public authService: AuthService
        ) {

         // Verifica se o id passado na URL existe na lista de modelos
        const currentPath = location.pathname;
        const idExists = this.modelosList.some(modelo => currentPath === `/modelo/${modelo.id}`);

        if (!idExists) {
         this.router.navigate(['404']);
        }

        // Escuta mudanças de rota
        this.router.events
          .pipe(
            filter(event => event instanceof NavigationEnd),
            takeUntil(this.destroy$)
          )
          .subscribe(() => {
            this.carregarModelo();
          })
    }

    ngOnInit() {
      this.isLoggedIn = this.authService.isSignedIn();

      this.authService.isAuthenticated().subscribe(loggedIn => {
        this.isLoggedIn = loggedIn;
      });

        this.carregarModelo();
    }

    carregarModelo() {
      window.scrollTo(0, 0);

      const id = this.route.snapshot.paramMap.get('id');

      if (!id) {
          this.router.navigate(['404']);
          return;
      }

      this.currentModelo = this.modelosList.find(m => m.id === id);

      if (!this.currentModelo) {
          this.router.navigate(['404']);
          return;
      }

      // Atualiza o estado de favorito
      this.currentModelo.isSalvo = this.bookmarkService.isSalvo(this.currentModelo.id);

      // Atualiza os serviços para controle dos breadcrumbs
      this.modoExplorarService.setModoExplorarAtivo(false);
      this.modoExplorarService.setModeloId(Number(id));
      this.modoExplorarService.setFiltrosAtuais({});

      // Carrega modelos similares
      this.carregarModelosSimilares();
    }

    // 👇 NOVOS MÉTODOS PARA CODEPEN
    isCodePenUrl(url: string): boolean {
      return url?.includes('codepen.io');
    }

    getCodePenId(url: string): string {
      if (!this.isCodePenUrl(url)) return '';
      
      // Extrai o ID do CodePen da URL
      // Exemplo: https://codepen.io/CaioPaiola/pen/nojJmQ → nojJmQ
      const match = url.match(/codepen\.io\/[^/]+\/pen\/([^/?]+)/);
      return match ? match[1] : '';
    }

    getCodePenUser(url: string): string {
      if (!this.isCodePenUrl(url)) return '';
      
      // Extrai o usuário do CodePen da URL
      // Exemplo: https://codepen.io/CaioPaiola/pen/nojJmQ → CaioPaiola
      const match = url.match(/codepen\.io\/([^/]+)\/pen\//);
      return match ? match[1] : '';
    }

    toggleBookmark(modelo: Modelo) {
        modelo.isSalvo = !modelo.isSalvo;
        this.bookmarkService.toggle(modelo.id);
    }

    carregarModelosSimilares() {
        if (!this.currentModelo || !this.modelosList) return;
    
        const modelosFiltrados = this.modelosList.filter(modelo => 
            modelo.id !== this.currentModelo.id &&
            (
                this.temCategoriaComum(modelo) ||
                this.temTagsComuns(modelo)
            )
        );
    
        if (modelosFiltrados.length <= 4) {
            this.modelosSimilares = modelosFiltrados;
            return;
        }
    
        this.modelosSimilares = this.embaralharArray(modelosFiltrados).slice(0, 4);
    }
    
    private embaralharArray(array: any[]): any[] {
        const arrayEmbaralhado = [...array];
        
        for (let i = arrayEmbaralhado.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arrayEmbaralhado[i], arrayEmbaralhado[j]] = [arrayEmbaralhado[j], arrayEmbaralhado[i]];
        }
        
        return arrayEmbaralhado;
    }

    private temCategoriaComum(modelo: Modelo): boolean {
        if (!this.currentModelo.categorias || !modelo.categorias) return false;

        const categoriasAtual = Array.isArray(this.currentModelo.categorias)
        ? this.currentModelo.categorias
        : [this.currentModelo.categorias];

        const categoriasModelo = Array.isArray(modelo.categorias) 
            ? modelo.categorias 
            : [modelo.categorias];
            
        return categoriasAtual.some((cat: string) => 
            categoriasModelo.includes(cat)
        );
    }

    private temTagsComuns(modelo: Modelo): boolean {
        if (!this.currentModelo.tags || !modelo.tags) return false;
        
        return this.currentModelo.tags.some((tag: string) => 
            modelo.tags.includes(tag)
        );
    }

    navegarParaModelo(modeloId: string) {
        this.router.navigate(['/modelo', modeloId])
        .then( () => {
          this.carregarModelo();
        } )
    }

    abrirModalImagem(imagemUrl: string) {
      this.imagemModal = imagemUrl;
      this.modalAberto = true;
      document.body.style.overflow = 'hidden';
    }

    fecharModalImagem() {
      this.modalAberto = false;
      this.imagemModal = '';
      document.body.style.overflow = 'auto';
    }

    toggleMenuOpcoes(): void {
      this.menuOpcoesAberto = !this.menuOpcoesAberto;
    }

    editarModelo(): void {
      console.log('Editar Modelo clicado');
      this.menuOpcoesAberto = false;
    }

    adicionarAoTopo(): void {
      console.log('Adicionar ao Topo clicado');
      this.menuOpcoesAberto = false;
    }
  
    adicionarAosDestaques(): void {
        console.log('Adicionar aos Destaques clicado');
        this.menuOpcoesAberto = false;
    }
  
    excluirModelo(): void {
        console.log('Excluir Modelo clicado');
        this.menuOpcoesAberto = false;
    }

    @HostListener('document:keydown.escape', ['$event'])
    fecharModalComEsc(event: Event) {
      if (this.modalAberto) {
        this.fecharModalImagem();
      }
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        if (!target.closest('.modelo-action-buttons')) {
            this.menuOpcoesAberto = false;
        }
    }

    ngOnDestroy() {
      this.destroy$.next();
      this.destroy$.complete();
    }
}