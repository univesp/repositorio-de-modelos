import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { isSignedIn } from '../../utils/get-signedin'; 
import { Modelo } from '../../interfaces/modelo/modelo.interface';
import { Modeloslist } from '../../data/modelos-list';
import { BookmarkService } from '../../services/bookmark.service'; 

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  modelos: Modelo[] = [];
  isPrivate: boolean = true;

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
  }

}
