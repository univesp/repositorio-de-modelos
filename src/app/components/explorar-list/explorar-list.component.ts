import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Modeloslist } from '../../data/modelos-list';

@Component({
  selector: 'app-explorar-list',
  templateUrl: './explorar-list.component.html',
  styleUrl: './explorar-list.component.scss'
})
export class ExplorarListComponent {
  @Input({required: true}) modelosList: any = Modeloslist;

  constructor(private router: Router){
  }

  redirectModeloPage(id: string) {
    this.router.navigate([`modelo/${id}`])
  }
}
