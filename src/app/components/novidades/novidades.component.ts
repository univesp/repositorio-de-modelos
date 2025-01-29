import { Component } from '@angular/core';

@Component({
  selector: 'app-novidades',
  templateUrl: './novidades.component.html',
  styleUrl: './novidades.component.scss'
})
export class NovidadesComponent {

  cards = [
    {
      img: "https://assets.univesp.br/repositorio-de-modelos/card-sm1.png"
    },
    {
      img: "https://assets.univesp.br/repositorio-de-modelos/card-sm2.png"
    },
    {
      img: "https://assets.univesp.br/repositorio-de-modelos/card-sm3.png"
    },
    {
      img: "https://assets.univesp.br/repositorio-de-modelos/card-sm4.png"
    },
    {
      img: "https://assets.univesp.br/repositorio-de-modelos/card-sm5.png"
    },
    {
      img: "https://assets.univesp.br/repositorio-de-modelos/card-sm3.png"
    },
    {
      img: "https://assets.univesp.br/repositorio-de-modelos/card-sm2.png"
    },
    {
      img: "https://assets.univesp.br/repositorio-de-modelos/card-sm4.png"
    },
    {
      img: "https://assets.univesp.br/repositorio-de-modelos/card-sm5.png"
    },
    {
      img: "https://assets.univesp.br/repositorio-de-modelos/card-sm1.png"
    }
  ];

  slideConfig = {
    "slidesToShow": 5,
    "slidesToScroll": 1,
    "autoplay": false,
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
