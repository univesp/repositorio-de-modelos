import { Component, Input } from '@angular/core';
import { Modeloslist } from '../../data/modelos-list';

@Component({
  selector: 'app-explorar-grid',
  templateUrl: './explorar-grid.component.html',
  styleUrl: './explorar-grid.component.scss'
})
export class ExplorarGridComponent {
  @Input({required: true}) modelosList: any = Modeloslist;
}
