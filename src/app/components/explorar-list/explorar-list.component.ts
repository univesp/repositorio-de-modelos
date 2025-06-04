import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Modelo } from '../../interfaces/modelo/modelo.interface';
import { Modeloslist } from '../../data/modelos-list';
import { BookmarkService } from '../../services/bookmark.service'; 

@Component({
  selector: 'app-explorar-list',
  templateUrl: './explorar-list.component.html',
  styleUrl: './explorar-list.component.scss'
})
export class ExplorarListComponent {
  @Input({required: true}) modelosList: Modelo[] = Modeloslist;

  constructor(
      private router: Router,
      private bookmarkService: BookmarkService
    )
  { }

  redirectModeloPage(id: string) {
    this.router.navigate([`modelo/${id}`])
  }

  toggleBookmark(modelo: Modelo, event: MouseEvent): void {
    event.stopPropagation(); // impede o clique no card
    this.bookmarkService.toggle(modelo.id); // salva ou remove do localStorage
    modelo.isSalvo = this.bookmarkService.isSalvo(modelo.id); // atualiza visual
  }
}
