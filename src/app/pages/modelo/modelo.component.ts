import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Modeloslist } from '../../data/modelos-list';

@Component({
    selector: 'app-modelo',
    templateUrl: './modelo.component.html',
    styleUrl: './modelo.component.scss'
})
export class ModeloComponent implements OnInit {
    modelosList: any = Modeloslist;
    possibleIds: any = [];
    
    constructor(private router: Router) {

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

        for (let i = 0; i < this.modelosList.length; i++) {
            
            if(location.pathname === `/modelo/${this.modelosList[i].id}`) {
                this.currentModelo.push(this.modelosList[i]);
            }
            
        }
    }
}
