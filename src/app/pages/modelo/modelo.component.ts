import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Modelo } from '../../interfaces/modelo/modelo.interface';
import { Modeloslist } from '../../data/modelos-list';
import { BookmarkService } from '../../services/bookmark.service';
import { ModoExplorarService } from '../../services/modo-explorar.service';

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
            private route: ActivatedRoute,
            private bookmarkService: BookmarkService,
            private modoExplorarService: ModoExplorarService
        ) {

         // Verifica se o id passado na URL existe na lista de modelos
        const currentPath = location.pathname;
        const idExists = this.modelosList.some(modelo => currentPath === `/modelo/${modelo.id}`);

        if (!idExists) {
         this.router.navigate(['404']);
        }

    }

    currentModelo: any = [];

    ngOnInit() {
        window.scrollTo(0, 0);

        const id = this.route.snapshot.paramMap.get('id');

        if (!id) {
            this.router.navigate(['404']);
            return;
          }

        this.currentModelo = this.modelosList.find(m => m.id === id);

        if (!this.currentModelo) {
            this.router.navigate(['404']);
            return;
          }

        // Atualiza o estado de favorito
        this.currentModelo.isSalvo = this.bookmarkService.isSalvo(this.currentModelo.id);

        // Atualiza os serviços para controle dos breadcrumbs
        this.modoExplorarService.setModoExplorarAtivo(false); // Entrou direto no modelo
        this.modoExplorarService.setModeloId(Number(id));
        this.modoExplorarService.setFiltrosAtuais({}); //  Resetar os filtros ao entrar em um modelo
    }

    toggleBookmark(modelo: Modelo) {
        modelo.isSalvo = !modelo.isSalvo;

        this.bookmarkService.toggle(modelo.id);  // Alterna no localStorage
      }
}
