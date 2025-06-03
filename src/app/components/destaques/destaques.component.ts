import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Modelo } from '../../interfaces/modelo/modelo.interface';
import { Modeloslist } from '../../data/modelos-list';

@Component({
  selector: 'app-destaques',
  templateUrl: './destaques.component.html',
  styleUrl: './destaques.component.scss'
})
export class DestaquesComponent {

  @Input({required: true}) modelosList: Modelo[] = Modeloslist;
  modelosDestaque: Modelo[] = Modeloslist.filter(modelo => modelo.isDestaque === true);

  constructor(private router: Router){
  }

  redirectModeloPage(id: string) {
    this.router.navigate([`modelo/${id}`])
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
