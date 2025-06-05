import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FilterConfigList } from '../../data/filterConfig-list'; 
import { FiltroConfig } from '../../interfaces/filter/filterConfig.interface';

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss'
})
export class FilterComponent {
  searchTerm: string = '';

  filtros: { [key: string]: string } = {};

  filtrosConfig: FiltroConfig[] = FilterConfigList;

  constructor(private router: Router){
    // Inicializa todos os filtros com o placeholder como valor padrão
    this.filtrosConfig.forEach(f => {
      this.filtros[f.key] = f.placeholder;
    });
  }

  goToExplorar() {
    this.router.navigate(['explorar']);
  }

  clearSearch() {
    this.searchTerm = '';
  }
  
}
