import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { isSignedIn } from '../../utils/get-signedin'; 
import { Modelo } from '../../interfaces/modelo/modelo.interface';
import { Modeloslist } from '../../data/modelos-list';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  modelos: Modelo[] = Modeloslist;

  ngOnInit() {
    if(this.isPrivate && !isSignedIn()) {
      this.router.navigate(['login']);
    }
  }

  constructor(private router: Router){
  }

  isPrivate: boolean = true;

}
