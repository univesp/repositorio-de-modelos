import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { isSignedIn } from '../../utils/get-signedin'; 

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  ngOnInit() {
    if(this.isPrivate && !isSignedIn()) {
      this.router.navigate(['login']);
    }
  }

  constructor(private router: Router){
  }

  isPrivate: boolean = true;

}
