import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { Modelo } from '../../interfaces/modelo/modelo.interface';
import { Modeloslist } from '../../data/modelos-list';
import { BookmarkService } from '../../services/bookmark.service'; 

@Component({
  selector: 'app-explorar-grid',
  templateUrl: './explorar-grid.component.html',
  styleUrl: './explorar-grid.component.scss'
})
export class ExplorarGridComponent {
  @Input({required: true}) modelosList: Modelo[] = Modeloslist;

  constructor(
      private router: Router,
      private bookmarkService: BookmarkService
    ) { }

  @Output() modeloSelecionado = new EventEmitter<string>();

  redirectModeloPage(id: string, event?: MouseEvent) {
    // 1. Previne comportamentos padrão e propagação
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  
    // 2. Delay mínimo para garantir que outros eventos terminem
    setTimeout(() => {
      // 3. Emite o evento para o Dashboard (se necessário)
      this.modeloSelecionado.emit(id);
      
      // 4. Navegação com tratamento de erro
      this.router.navigate(['/modelo', id]).then(navigationSuccess => {
        if (!navigationSuccess) {
          console.error('Falha na navegação para o modelo', id);
          this.router.navigate(['/']); // Fallback
        }
      }).catch(err => {
        console.error('Erro na navegação:', err);
      });
    }, 50); // Delay de 50ms é seguro para conflitos de UI
  }

  toggleBookmark(modelo: Modelo, event: MouseEvent): void {
    event.stopPropagation(); // impede o clique no card
    this.bookmarkService.toggle(modelo.id); // salva ou remove do localStorage
    modelo.isSalvo = this.bookmarkService.isSalvo(modelo.id); // atualiza visual
  }

}
