import { Component, OnInit } from '@angular/core';
import { Modeloslist } from '../../data/modelos-list'; 

@Component({
  selector: 'app-explorar',
  templateUrl: './explorar.component.html',
  styleUrl: './explorar.component.scss'
})
export class ExplorarComponent implements OnInit {

  viewType: string = "grid";
  opacityClicked: number = 1;
  modelosList: any = Modeloslist;
  
  ngOnInit() {
    console.log('olá')
    
  }

  switchViewType(type: string) {
    this.viewType = type;
  }
}
