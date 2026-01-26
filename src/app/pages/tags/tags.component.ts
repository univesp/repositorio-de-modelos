import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiModelosService } from '../../services/api-modelos.service';

@Component({
  selector: 'app-tags',
  templateUrl: './tags.component.html',
  styleUrls: ['./tags.component.scss']
})
export class TagsComponent implements OnInit, OnDestroy {
  todasAsTags: { tag: string, count: number, tagOriginal: string }[] = []; // ADICIONAR tagOriginal
  tagsFiltradas: { tag: string, count: number, tagOriginal: string }[] = [];
  tagsOrdenadas: { tag: string, count: number, tagOriginal: string }[] = [];
  totalTags: number = 0;
  tagsExibidas: number = 0;
  ordenacaoSelecionada: string = 'populares';
  termoPesquisa: string = '';
  
  isLoading = true;
  
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private apiModelosService: ApiModelosService
  ) {}

  ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.carregarTodasAsTagsDaAPI();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * CARREGA TODAS AS TAGS DA API
   */
  carregarTodasAsTagsDaAPI() {
    this.isLoading = true;
    
    this.apiModelosService.getModelosDaAPI()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (modelosAPI) => {
          //console.log('Modelos carregados para tags:', modelosAPI.length);
          this.processarTagsDosModelos(modelosAPI);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Erro ao carregar tags da API:', error);
          this.todasAsTags = [];
          this.tagsFiltradas = [];
          this.tagsOrdenadas = [];
          this.isLoading = false;
        }
      });
  }

  /**
   * PROCESSAR TAGS DOS MODELOS
   */
  private processarTagsDosModelos(modelosAPI: any[]) {
    const tagCount: { [key: string]: number } = {};

    // Conta a frequência de todas as tags
    modelosAPI.forEach(modelo => {
      if (modelo.tags && Array.isArray(modelo.tags)) {
        modelo.tags.forEach((tag: string) => {
          const tagNormalizada = tag.trim().toLowerCase();
          if (tagNormalizada) {
            tagCount[tagNormalizada] = (tagCount[tagNormalizada] || 0) + 1;
          }
        });
      }
    });

    // Converte para array
    this.todasAsTags = Object.entries(tagCount)
      .map(([tagOriginal, count]) => ({ 
        tag: this.formatarTagParaExibicao(tagOriginal), 
        tagOriginal: tagOriginal, // Guarda original para filtro
        count 
      }));

    this.totalTags = this.todasAsTags.length;
    //console.log(`${this.totalTags} tags encontradas`);
    
    this.filtrarTags();
  }

  /**
   * FORMATA TAG PARA EXIBIÇÃO
   */
  private formatarTagParaExibicao(tag: string): string {
    // Primeira letra maiúscula e o resto mantém
    return tag.charAt(0).toUpperCase() + tag.slice(1);
  }

  /**
   * FILTRAR TAGS
   */
  filtrarTags() {
    if (!this.termoPesquisa.trim()) {
      // Se não há termo de pesquisa, mostra todas as tags
      this.tagsFiltradas = [...this.todasAsTags];
    } else {
      // Filtra as tags que contêm o termo de pesquisa (ignora case)
      const termo = this.termoPesquisa.toLowerCase().trim();
      this.tagsFiltradas = this.todasAsTags.filter(tagInfo => 
        tagInfo.tagOriginal.toLowerCase().includes(termo) ||
        tagInfo.tag.toLowerCase().includes(termo)
      );
    }
    
    this.tagsExibidas = this.tagsFiltradas.length;
    this.ordenarTags();
  }

  /**
   * ORDENAR TAGS
   */
  ordenarTags() {
    if (this.ordenacaoSelecionada === 'populares') {
      // Ordena por frequência (decrescente)
      this.tagsOrdenadas = [...this.tagsFiltradas].sort((a, b) => b.count - a.count);
    } else {
      // Ordena alfabeticamente
      this.tagsOrdenadas = [...this.tagsFiltradas].sort((a, b) => 
        a.tag.localeCompare(b.tag, 'pt-BR', { sensitivity: 'base' })
      );
    }
  }

  /**
   * ON ORDENAÇÃO CHANGE
   */
  onOrdenacaoChange() {
    this.ordenarTags();
  }

  /**
   * ON PESQUISA CHANGE
   */
  onPesquisaChange() {
    this.filtrarTags();
  }

  /**
   * LIMPAR PESQUISA
   */
  limparPesquisa() {
    this.termoPesquisa = '';
    this.filtrarTags();
  }

  /**
   * GETTER PARA TEXTO DE EXIBIÇÃO
   */
  get textoExibicao(): string {
    if (this.isLoading) {
      return 'Carregando tags...';
    }
    
    if (!this.termoPesquisa.trim()) {
      return `Exibindo ${this.totalTags} tags encontradas no sistema.`;
    } else {
      return `Exibindo ${this.tagsExibidas} de ${this.totalTags} tags encontradas no sistema.`;
    }
  }

  /**
   * MÉTODO CHAMADO QUANDO UMA TAG É CLICADA
   */
  onTagClick(tagItem: { tag: string, tagOriginal: string, count: number }) {
    // Usa a tag original (em lowercase) para o filtro
    const tagParaFiltro = tagItem.tagOriginal;
    
    // Obter parâmetros atuais (se houver) para combinar com a nova tag
    const paramsAtuais = { ...this.route.snapshot.queryParams };
    
    // Combina parâmetros atuais com a nova tag
    const queryParams = {
      ...paramsAtuais,
      tags: tagParaFiltro
    };
  
    // Navega para a página de resultados com o filtro de tag
    this.router.navigate(['/resultados'], { 
      queryParams: queryParams 
    });
  }
}