import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Modelo } from '../../interfaces/modelo/modelo.interface';
import { Modeloslist } from '../../data/modelos-list';
import { BookmarkService } from '../../services/bookmark.service';

@Component({
    selector: 'app-modelo',
    templateUrl: './modelo.component.html',
    styleUrl: './modelo.component.scss'
})
export class ModeloComponent implements OnInit {
    modelosList: Modelo[] = Modeloslist;
    possibleIds: any = [];
    
    constructor(
            private router: Router,
            private bookmarkService: BookmarkService
        ) {

        // Verifica dentro do array modelosList se o id passado na URL existe 
        // Caso exista, adiciona true no array possibleIds
        for (let i = 0; i < this.modelosList.length; i++) {

            if(location.pathname !== `/modelo/${this.modelosList[i].id}`) {
                this.possibleIds.push(false);
            } else {
                this.possibleIds.push(true);
            }  
            
        }

        // Váriavel que retornará true caso o ID passado na URL exista dentro do array "possibelIds"
        let idExists = this.possibleIds.includes(true);

        //Se não existir ID, redireciona pra página não encontrada
        if(!idExists) {
            this.router.navigate([`404`])
        }

    }

    currentModelo: any = [];

    ngOnInit() {
        window.scrollTo(0, 0);

        const id = location.pathname.split('/').pop();  // pega o ID da URL

        this.currentModelo = this.modelosList.find(m => m.id === id);

        if(this.currentModelo) {
            this.currentModelo.isSalvo = this.bookmarkService.isSalvo(this.currentModelo.id);
        } else {
            this.router.navigate(['404']);
        }
    }

    toggleBookmark(modelo: Modelo) {
        modelo.isSalvo = !modelo.isSalvo;

        this.bookmarkService.toggle(modelo.id);  // Alterna no localStorage
      }
}
