import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Modelo } from '../../interfaces/modelo/modelo.interface';
import { Modeloslist } from '../../data/modelos-list';
import { BookmarkService } from '../../services/bookmark.service';

@Component({
  selector: 'app-destaques',
  templateUrl: './destaques.component.html',
  styleUrl: './destaques.component.scss'
})
export class DestaquesComponent {

  @Input({required: true}) modelosList: Modelo[] = [];

  constructor(
      private router: Router,
      private bookmarkService: BookmarkService
    )
    { }

  redirectModeloPage(id: string) {
    this.router.navigate([`modelo/${id}`])
  }

  toggleBookmark(modelo: any) {
    this.bookmarkService.toggle(modelo.id);
    modelo.isSalvo = this.bookmarkService.isSalvo(modelo.id);
  }

  get modelosDestaque(): Modelo[] {
    return this.modelosList.filter(modelo => modelo.isDestaque)
  }

  modelosConfig = {
    "slidesToShow": 3,
    "slidesToScroll": 1,
    "autoplay": false,
    "autoplaySpeed": 5000,
    "pauseOnHover": true,
    "infinite": false,
    "responsive": [
      {
        "breakpoint": 992,
        "settings": {
          "arrows": true,
          "infinite": true,
          "slidesToShow": 1,
          "slidesToScroll": 1
        }
      }
    ]
  };

}
