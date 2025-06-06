import { Component, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { FilterConfigList } from '../../data/filterConfig-list'; 
import { FiltroConfig } from '../../interfaces/filter/filterConfig.interface';
import { ModoExplorarService } from '../../services/modo-explorar.service';

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

  @Output() explorarClicked = new EventEmitter<void>();

  // Variável que armazena o que o usuário digitou no campo de busca
  searchTerm: string = '';

   // Objeto onde cada chave é o nome do filtro e o valor é o item selecionado
  filtros: { [key: string]: string } = {};

  // Array com as configurações dos filtros (rótulo, chave, placeholder e opções)
  filtrosConfig: FiltroConfig[] = FilterConfigList;

  constructor(
        private router: Router,
        private modoExplorarService: ModoExplorarService
      ) {
    
    const filtrosSalvos = this.modoExplorarService.getFiltrosAtuais();
    if (Object.keys(filtrosSalvos).length > 0) {
      this.filtros = { ...filtrosSalvos };
    } else {
      this.filtrosConfig.forEach(f => {
        this.filtros[f.key] = f.placeholder;
      });
    }

    // Escuta reset vindo da dashboard
    window.addEventListener('resetFiltros', () => {
     this.resetarFiltros();
    });
  }

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
    this.voltarParaHomeSeEstiverNoModelo();

    this.filtrosChanged.emit({
      filtros: this.filtros,
      searchTerm: this.searchTerm
    });

    this.modoExplorarService.setFiltrosAtuais(this.filtros);
  }

   // Chame este método ao alterar algum filtro individualmente
   onFiltroChange() {
    this.emitirMudancas();
  }

  // Detecta se estamos na página de um modelo e redireciona para Home ativando modoExplorar
    private voltarParaHomeSeEstiverNoModelo() {
      if (this.router.url.startsWith('/modelo/')) {
        this.modoExplorarService.setModoExplorarAtivo(true); // Ativa modo explorar
        this.modoExplorarService.setFiltrosAtuais(this.filtros); // Salva filtros
        this.router.navigate(['/']); // Navega para Home
      }
  }

  resetarFiltros() {
    this.searchTerm = '';
    this.filtrosConfig.forEach(f => {
      this.filtros[f.key] = f.placeholder;
    });
    this.emitirMudancas();
  }
  
}
