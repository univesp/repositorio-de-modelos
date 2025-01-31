import { Component } from '@angular/core';

@Component({
  selector: 'app-destaques',
  templateUrl: './destaques.component.html',
  styleUrl: './destaques.component.scss'
})
export class DestaquesComponent {
  modelos = [
    {
      titulo: "Modelo EC Elit",
      date: "Out 22, 2024",
      disciplina: "EDU400",
      categorias: ["Jogo", "Interativo", "RA", "RV"],
      imagem: "https://assets.univesp.br/repositorio-de-modelos/img-md1.png",
      descricao: "Maecenas feugiat auctor rhoncus. Proin imperdiet imperdiet ante, non rhoncus orci ultricies quis. Donec id tincidunt libero, at facilisis magna. Quisque non ultricies ante, eu suscipit lorem. Nullam sagittis aliquam tellus, in varius felis...",
      autor: "Ipsum Amet"
    },
    {
      titulo: "Modelo EP Sed",
      date: "Out 22, 2024",
      disciplina: "EDU400",
      categorias: ["Jogo", "Interativo", "RA", "RV"],
      imagem: "https://assets.univesp.br/repositorio-de-modelos/img-md2.png",
      descricao: "Aliquam eu sodales lorem. In lacus ante, eleifend varius imperdiet nec, facilisis id nisi. Donec consectetur congue aliquet. Mauris at elit tellus. Mauris iaculis diam lacus, et ultrices tellus efficitur in. Etiam id sapien ut diam rhoncus euismod...",
      autor: "Amet Lorem"
    },
    {
      titulo: "Modelo MA Amet",
      date: "Out 22, 2024",
      disciplina: "EDU400",
      categorias: ["Jogo", "Interativo", "RA", "RV"],
      imagem: "https://assets.univesp.br/repositorio-de-modelos/img-md3.png",
      descricao: "Curabitur ornare magna arcu, eu vehicula nibh tincidunt eu. Duis auctor tortor at ornare consectetur. Vestibulum mi dolor, feugiat eget euismod id, euismod et orci. Proin consequat, est eu congue mattis...",
      autor: "Lorem Dolor"
    },
    {
      titulo: "Modelo EC Elit",
      date: "Out 22, 2024",
      disciplina: "EDU400",
      categorias: ["Jogo", "Interativo", "RA", "RV"],
      imagem: "https://assets.univesp.br/repositorio-de-modelos/img-md1.png",
      descricao: "Maecenas feugiat auctor rhoncus. Proin imperdiet imperdiet ante, non rhoncus orci ultricies quis. Donec id tincidunt libero, at facilisis magna. Quisque non ultricies ante, eu suscipit lorem. Nullam sagittis aliquam tellus, in varius felis...",
      autor: "Ipsum Amet"
    },
    {
      titulo: "Modelo EP Sed",
      date: "Out 22, 2024",
      disciplina: "EDU400",
      categorias: ["Jogo", "Interativo", "RA", "RV"],
      imagem: "https://assets.univesp.br/repositorio-de-modelos/img-md2.png",
      descricao: "Aliquam eu sodales lorem. In lacus ante, eleifend varius imperdiet nec, facilisis id nisi. Donec consectetur congue aliquet. Mauris at elit tellus. Mauris iaculis diam lacus, et ultrices tellus efficitur in. Etiam id sapien ut diam rhoncus euismod...",
      autor: "Amet Lorem"
    }
  ];

  modelosConfig = {
    "slidesToShow": 3,
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
