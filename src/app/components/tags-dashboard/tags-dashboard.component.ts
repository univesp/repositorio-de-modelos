// components/tags-dashboard/tags-dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiModelosService } from '../../services/api-modelos.service';

@Component({
  selector: 'app-tags-dashboard',
  templateUrl: './tags-dashboard.component.html',
  styleUrls: ['./tags-dashboard.component.scss']
})
export class TagsDashboardComponent implements OnInit, OnDestroy {
  tagsPopulares: { tag: string, count: number }[] = [];
  isLoading = true;
  
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private apiModelosService: ApiModelosService
  ) {}

  ngOnInit() {
    this.carregarTagsPopulares();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * CARREGA TAGS POPULARES DA API
   */
  carregarTagsPopulares() {
    this.isLoading = true;
    
    this.apiModelosService.getModelosDaAPI()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (modelosAPI) => {
          console.log('📦 Modelos carregados para tags populares:', modelosAPI.length);
          this.processarTagsPopulares(modelosAPI);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Erro ao carregar tags populares:', error);
          this.tagsPopulares = [];
          this.isLoading = false;
        }
      });
  }

  /**
   * PROCESSAR TAGS POPULARES
   */
  private processarTagsPopulares(modelosAPI: any[]) {
    const tagCount: { [key: string]: number } = {};

    // Conta a frequência de todas as tags
    modelosAPI.forEach(modelo => {
      if (modelo.tags && Array.isArray(modelo.tags)) {
        modelo.tags.forEach((tag: string) => {
          // Normaliza a tag (remove espaços, lowercase)
          const tagNormalizada = tag.trim().toLowerCase();
          
          if (tagNormalizada) {
            tagCount[tagNormalizada] = (tagCount[tagNormalizada] || 0) + 1;
          }
        });
      }
    });

    // Converte para array, ordena e pega as top 10
    const tagsArray = Object.entries(tagCount)
      .map(([tag, count]) => ({ 
        tag: this.formatarTagParaExibicao(tag), 
        count 
      }))
      .sort((a, b) => b.count - a.count) // Ordena por frequência (decrescente)
      .slice(0, 10); // Top 10 mais populares

    this.tagsPopulares = tagsArray;
    console.log(`🏆 ${this.tagsPopulares.length} tags populares carregadas`);
  }

  /**
   * FORMATA TAG PARA EXIBIÇÃO
   */
  private formatarTagParaExibicao(tag: string): string {
    // Primeira letra maiúscula e mantém o resto
    return tag.charAt(0).toUpperCase() + tag.slice(1);
  }

  /**
   * QUANDO UMA TAG É CLICADA
   */
  onTagClick(tag: string) {
    // Usa a tag em lowercase para filtro
    const tagParaFiltro = tag.toLowerCase();
    
    // Navega para resultados com o filtro de tag
    this.router.navigate(['/resultados'], { 
      queryParams: { tags: tagParaFiltro } 
    });
  }

  /**
   * VER TODAS AS TAGS
   */
  verTodasAsTags() {
    this.router.navigate(['/tags']);
  }
}