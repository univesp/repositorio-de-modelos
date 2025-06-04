import { Component, OnInit } from '@angular/core';
import { Modeloslist } from '../../data/modelos-list'; 
import { BookmarkService } from '../../services/bookmark.service'; 
import { Modelo } from '../../interfaces/modelo/modelo.interface'; 

@Component({
  selector: 'app-explorar',
  templateUrl: './explorar.component.html',
  styleUrl: './explorar.component.scss'
})
export class ExplorarComponent implements OnInit {

  viewType: any = "grid";
  opacityClicked: number = 1;
  modelosList: Modelo[] = [];

  constructor(
    private bookmarkService: BookmarkService
  ) { }
  
  ngOnInit(): void {
    window.scrollTo(0, 0);

    // Pega o tipo de visualização salvo
    const savedViewType = localStorage.getItem('viewType');
    this.viewType = savedViewType ?? "grid";

    // Atualiza os modelos com status de bookmark
    this.atualizarModelosComBookmark();
  }

  switchViewType(type: string): void {
    this.viewType = type;
    localStorage.setItem('viewType', type);
    this.atualizarModelosComBookmark(); // Atualiza o status de bookmarks ao trocar visualização
  }

  atualizarModelosComBookmark(): void {
    this.modelosList = Modeloslist.map(modelo => ({
      ...modelo,
      isSalvo: this.bookmarkService.isSalvo(modelo.id)
    }));
  }
}
