import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Modelo } from '../../interfaces/modelo/modelo.interface';
import { Modeloslist } from '../../data/modelos-list';
import { BookmarkService } from '../../services/bookmark.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-destaques',
  templateUrl: './destaques.component.html',
  styleUrl: './destaques.component.scss'
})
export class DestaquesComponent implements OnInit {

  @Input({required: true}) modelosList: Modelo[] = [];
  isLoggedIn: boolean = false;

  constructor(
      private router: Router,
      private bookmarkService: BookmarkService,
      private authService: AuthService
    )
    { }

  ngOnInit() {
    this.isLoggedIn = this.authService.isSignedIn();

    this.authService.isAuthenticated().subscribe(loggedIn => {
      this.isLoggedIn = loggedIn;
    })
  }

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
