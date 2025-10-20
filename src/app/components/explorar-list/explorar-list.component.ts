import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Modelo } from '../../interfaces/modelo/modelo.interface';
import { Modeloslist } from '../../data/modelos-list';
import { BookmarkService } from '../../services/bookmark.service'; 
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-explorar-list',
  templateUrl: './explorar-list.component.html',
  styleUrl: './explorar-list.component.scss'
})
export class ExplorarListComponent implements OnInit {
  @Input({required: true}) modelosList: Modelo[] = Modeloslist;

  constructor(
      private router: Router,
      private bookmarkService: BookmarkService,
      private authService: AuthService
    )
  { }

  @Output() modeloSelecionado = new EventEmitter<string>();

  isLoggedIn: boolean = false;

  ngOnInit() {
    this.isLoggedIn = this.authService.isSignedIn();

    this.authService.isAuthenticated().subscribe(loggedIn => {
      this.isLoggedIn = loggedIn;
    })
  }

  redirectModeloPage(id: string) {
    this.modeloSelecionado.emit(id); // Emite o evento primeiro
    this.router.navigate(['/modelo', id]); // Depois navega
  }

  toggleBookmark(modelo: Modelo, event: MouseEvent): void {
    event.stopPropagation(); // impede o clique no card
    this.bookmarkService.toggle(modelo.id); // salva ou remove do localStorage
    modelo.isSalvo = this.bookmarkService.isSalvo(modelo.id); // atualiza visual
  }

}
