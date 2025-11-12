import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Modeloslist } from '../../data/modelos-list';

@Component({
  selector: 'app-tags-dashboard',
  templateUrl: './tags-dashboard.component.html',
  styleUrl: './tags-dashboard.component.scss'
})
export class TagsDashboardComponent implements OnInit {
  tagsPopulares: { tag: string, count: number }[] = [];

  constructor(private router: Router) {}

  ngOnInit() {
    this.carregarTagsPopulares();
  }

  carregarTagsPopulares() {
    // Objeto para contar a frequência de cada tag
    const tagCount: { [key: string]: number } = {};

    // Percorre todos os modelos e conta as tags
    Modeloslist.forEach(modelo => {
      if (modelo.tags && Array.isArray(modelo.tags)) {
        modelo.tags.forEach(tag => {
          // Remove espaços extras e converte para minúsculas para evitar duplicatas
          const tagNormalizada = tag.trim().toLowerCase();
          
          if (tagNormalizada) {
            tagCount[tagNormalizada] = (tagCount[tagNormalizada] || 0) + 1;
          }
        });
      }
    });

    // Converte o objeto em array e ordena por frequência (decrescente)
    const tagsArray = Object.entries(tagCount)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count) // Ordena do maior para o menor
      .slice(0, 10); // Pega apenas as 10 mais populares

    this.tagsPopulares = tagsArray;
  }

  /**
   * Método chamado quando uma tag é clicada
   * Redireciona para a página de resultados filtrando pela tag selecionada
   */
  onTagClick(tag: string) {
    // Navega para a página de resultados com o filtro de tag
    this.router.navigate(['/resultados'], { 
      queryParams: { tags: tag } 
    });
  }

  /**
   * Método chamado quando o botão "Ver todas as tags" é clicado
   * Redireciona para a página completa de tags
   */
  verTodasAsTags() {
    this.router.navigate(['/tags']);
  }
}
