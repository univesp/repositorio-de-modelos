import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { isSignedIn } from '../../utils/get-signedin'; 
import { Modelo } from '../../interfaces/modelo/modelo.interface';
import { Modeloslist } from '../../data/modelos-list';
import { BookmarkService } from '../../services/bookmark.service'; 
import { FilterConfigList } from '../../data/filterConfig-list'; 

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  modelos: Modelo[] = [];
  modelosFiltrados: Modelo[] = [];

  isPrivate: boolean = true;
  modoExplorarAtivo: boolean = false;

  viewType: 'grid' | 'list' = 'grid'; // tipo de visualização. começa com 'grid'
  opacityClicked: number = 1;

  constructor(
      private router: Router,
      private bookmarkService: BookmarkService
    )
  { }

  ngOnInit(): void {
    if(this.isPrivate && !isSignedIn()) {
      this.router.navigate(['login']);
    }

    this.modelos = Modeloslist.map(modelo => ({
      ...modelo,
      isSalvo: this.bookmarkService.isSalvo(modelo.id)
    }));

    // Inicializa o tipo de visualização do localStorage (se houver)
    const savedViewType = localStorage.getItem('viewType');
    this.viewType = savedViewType === 'list' ? 'list' : 'grid';

    this.modelosFiltrados = [...this.modelos]; // inicializa com todos
  }

  // Quando filtros são alterados no <app-filter>, essa função é chamada
  onFiltrosChanged(dados: { filtros: { [key: string]: string }, searchTerm: string }) {
    const { filtros, searchTerm } = dados;

    const buscaTemTexto = searchTerm.trim().length > 0;

    const filtrosPreenchidos = Object.entries(filtros).some(
      ([key, valor]) => valor && valor.trim() !== '' && valor !== this.getFiltroPlaceholder(key)
    );

    // Ativa ou desativa o modoExplorar com base na presença de conteúdo relevante
    this.modoExplorarAtivo = buscaTemTexto || filtrosPreenchidos;

    // Por enquanto, mostra todos os modelos mesmo no modoExplorar
    this.modelosFiltrados = [...this.modelos];

  }

  // 🔍 Recupera o placeholder original de um filtro com base na key
  getFiltroPlaceholder(key: string): string {
    const filtro = FilterConfigList.find(f => f.key === key);
    return filtro?.placeholder || '';
  }

  // Alterna visualização grid/lista
  switchViewType(type: 'grid' | 'list') {
    this.viewType = type;
    localStorage.setItem('viewType', type);
  }

  resetFiltrosDashboard() {
    this.modoExplorarAtivo = false;
    this.modelosFiltrados = [...this.modelos];
  }

}
