import { Component, OnInit } from '@angular/core';
import { Modeloslist } from '../../data/modelos-list'; 

@Component({
  selector: 'app-explorar',
  templateUrl: './explorar.component.html',
  styleUrl: './explorar.component.scss'
})
export class ExplorarComponent implements OnInit {

  viewType: any = "grid";
  opacityClicked: number = 1;
  modelosList: any = Modeloslist;
  
  ngOnInit() {

    window.scrollTo(0, 0);

    if(!localStorage.getItem('viewType')){
      localStorage.setItem('viewType', this.viewType);
    } else {
      
      this.viewType =  localStorage.getItem('viewType')?.toString();
    }
    
    
  }

  switchViewType(type: string) {
    this.viewType = type;
    localStorage.setItem('viewType', type)
  }
}
