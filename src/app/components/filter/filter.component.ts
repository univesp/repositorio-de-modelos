import { Component, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { FilterConfigList } from '../../data/filterConfig-list'; 
import { FiltroConfig } from '../../interfaces/filter/filterConfig.interface';

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss'
})
export class FilterComponent {

  // Cria um "evento de saída" para comunicar mudanças para o componente pai (dashboard)
  @Output() filtrosChanged = new EventEmitter<{

    filtros: { [key: string]: string },  // Objeto com os filtros atuais
    searchTerm: string                  // Texto digitado no campo de busca

  }>();

  // Variável que armazena o que o usuário digitou no campo de busca
  searchTerm: string = '';

   // Objeto onde cada chave é o nome do filtro e o valor é o item selecionado
  filtros: { [key: string]: string } = {};

  // Array com as configurações dos filtros (rótulo, chave, placeholder e opções)
  filtrosConfig: FiltroConfig[] = FilterConfigList;

  constructor(private router: Router){
    // Inicializa todos os filtros com o placeholder como valor padrão
    this.filtrosConfig.forEach(f => {
      this.filtros[f.key] = f.placeholder;
    });
  }

  @Output() explorarClicked = new EventEmitter<void>()

  handleExplorar() {
    this.searchTerm = '';  // Limpa a busca
    this.filtrosConfig.forEach(f => {
      this.filtros[f.key] = f.placeholder;
    });

    this.emitirMudancas();  // dispara os valores limpos
    this.explorarClicked.emit();  // comunica ao componente pai
  }

  // Limpa o texto da busca e emite as mudanças para o componente pai
  clearSearch() {
    this.searchTerm = '';
    this.emitirMudancas();  // Após limpar, avisa que algo mudou
  }

  // Função que emite o evento para o componente pai com os filtros e busca atualizados
  emitirMudancas() {
    this.filtrosChanged.emit({
      filtros: this.filtros,
      searchTerm: this.searchTerm
    });
  }
  
}
