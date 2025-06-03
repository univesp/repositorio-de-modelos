import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Modelo } from '../../interfaces/modelo/modelo.interface';
import { Modeloslist } from '../../data/modelos-list';

@Component({
  selector: 'app-carousel',
  templateUrl: './carousel.component.html',
  styleUrl: './carousel.component.scss',
})
export class CarouselComponent implements OnInit {
  
  @Input({required: true}) modelosList: Modelo[] = Modeloslist;
  slides: Modelo[] = [];

  constructor(private router: Router){
  }

  redirectModeloPage(id: string) {
    this.router.navigate([`modelo/${id}`])
  }

  ngOnInit() {
    this.slides = this.modelosList.slice(0, 2);
  }
  
  
  slideConfig = {
    "slidesToShow": 1,
    "slidesToScroll": 1,
    "autoplay": true,
    "autoplaySpeed": 5000,
    "pauseOnHover": true,
    "infinite": true,
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
