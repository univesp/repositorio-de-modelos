import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Modeloslist } from '../../data/modelos-list';

@Component({
  selector: 'app-tags',
  templateUrl: './tags.component.html',
  styleUrl: './tags.component.scss'
})
export class TagsComponent implements OnInit {
  todasAsTags: { tag: string, count: number }[] = [];
  tagsFiltradas: { tag: string, count: number }[] = [];
  tagsOrdenadas: { tag: string, count: number }[] = [];
  totalTags: number = 0;
  tagsExibidas: number = 0;
  ordenacaoSelecionada: string = 'populares';
  termoPesquisa: string = '';

  constructor(private router: Router) {}

  ngOnInit() {
    window.scrollTo(0,0);
    this.carregarTodasAsTags();
  }

  carregarTodasAsTags() {
    const tagCount: { [key: string]: number } = {};

    // Conta a frequência de todas as tags
    Modeloslist.forEach(modelo => {
      if (modelo.tags && Array.isArray(modelo.tags)) {
        modelo.tags.forEach(tag => {
          const tagNormalizada = tag.trim().toLowerCase();
          if (tagNormalizada) {
            tagCount[tagNormalizada] = (tagCount[tagNormalizada] || 0) + 1;
          }
        });
      }
    });

    // Converte para array
    this.todasAsTags = Object.entries(tagCount)
      .map(([tag, count]) => ({ tag, count }));

    this.totalTags = this.todasAsTags.length;
    this.filtrarTags();
  }

  filtrarTags() {
    if (!this.termoPesquisa.trim()) {
      // Se não há termo de pesquisa, mostra todas as tags
      this.tagsFiltradas = [...this.todasAsTags];
    } else {
      // Filtra as tags que contêm o termo de pesquisa
      const termo = this.termoPesquisa.toLowerCase().trim();
      this.tagsFiltradas = this.todasAsTags.filter(tagInfo => 
        tagInfo.tag.toLowerCase().includes(termo)
      );
    }
    
    this.tagsExibidas = this.tagsFiltradas.length;
    this.ordenarTags();
  }

  ordenarTags() {
    if (this.ordenacaoSelecionada === 'populares') {
      // Ordena por frequência (decrescente)
      this.tagsOrdenadas = [...this.tagsFiltradas].sort((a, b) => b.count - a.count);
    } else {
      // Ordena alfabeticamente
      this.tagsOrdenadas = [...this.tagsFiltradas].sort((a, b) => a.tag.localeCompare(b.tag));
    }
  }

  onOrdenacaoChange() {
    this.ordenarTags();
  }

  onPesquisaChange() {
    this.filtrarTags();
  }

  limparPesquisa() {
    this.termoPesquisa = '';
    this.filtrarTags();
  }

  /**
   * Getter para gerar o texto dinâmico do título
   * baseado se há ou não filtro de pesquisa ativo
  */
  get textoExibicao(): string {
    if (!this.termoPesquisa.trim()) {
      // Sem filtro de pesquisa
      return `Exibindo ${this.totalTags} tags encontradas no sistema.`;
    } else {
      // Com filtro de pesquisa
      return `Exibindo ${this.tagsExibidas} de ${this.totalTags} tags encontradas no sistema.`;
    }
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

}