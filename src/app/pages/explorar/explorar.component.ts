import { Component, OnInit } from '@angular/core';
import { Modeloslist } from '../../data/modelos-list'; 

@Component({
  selector: 'app-explorar',
  templateUrl: './explorar.component.html',
  styleUrl: './explorar.component.scss'
})
export class ExplorarComponent implements OnInit {

  modelos: any = [];
  
  ngOnInit() {
    console.log(Modeloslist)
    this.modelos = Modeloslist;
  }

  testeBotao() {
    console.log(Modeloslist)
  }
}
