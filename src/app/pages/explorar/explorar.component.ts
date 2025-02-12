import { Component, OnInit } from '@angular/core';
import { Modeloslist } from '../../data/modelos-list'; 

@Component({
  selector: 'app-explorar',
  templateUrl: './explorar.component.html',
  styleUrl: './explorar.component.scss'
})
export class ExplorarComponent implements OnInit {

  viewType: string = "grid";
  
  ngOnInit() {
    console.log(Modeloslist)
    
  }

  switchViewType(type: string) {
    this.viewType = type;
  }
}
