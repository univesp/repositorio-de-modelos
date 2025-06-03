import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Modelo } from '../../interfaces/modelo/modelo.interface';
import { Modeloslist } from '../../data/modelos-list';

@Component({
  selector: 'app-novidades',
  templateUrl: './novidades.component.html',
  styleUrl: './novidades.component.scss'
})
export class NovidadesComponent implements OnInit {

  @Input({required: true}) modelosList: Modelo[] = Modeloslist;
  cards: Modelo[] = [];

  constructor(private router: Router){
  }

  redirectModeloPage(id: string) {
    this.router.navigate([`modelo/${id}`])
  }

  ngOnInit() {
    this.cards = this.modelosList.slice(0, 10);
  }

  

  slideConfig = {
    "slidesToShow": 5,
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
