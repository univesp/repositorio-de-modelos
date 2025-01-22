import { Component } from '@angular/core';

@Component({
  selector: 'app-carousel',
  templateUrl: './carousel.component.html',
  styleUrl: './carousel.component.scss',
})
export class CarouselComponent {
  slides= [
    {
      titulo: "Titulo do Modelo 1",
      texto: "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Delectus non voluptates qui odit sapiente molestiae. Odit incidunt, exercitationem nemo qui assumenda recusandae unde sunt itaque facilis dolorem quas voluptates cum.",
      img: "https://assets.univesp.br/repositorio-de-modelos/image1.png",
      tags: ["Lorem", "Ipsum", "Dolor", "Sit"]
    },
    {
      titulo: "Titulo do Modelo 2",
      texto: "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Delectus non voluptates qui odit sapiente molestiae. Odit incidunt, exercitationem nemo qui assumenda recusandae unde sunt itaque facilis dolorem quas voluptates cum.",
      img: "https://assets.univesp.br/repositorio-de-modelos/image2.png",
      tags: ["Lorem", "Ipsum", "Dolor", "Sit", "Amet"]
    }
  ];

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
