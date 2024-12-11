import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { isSignedIn } from '../../utils/get-signedin'; 

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  isPrivate: boolean = false;

  ngOnInit() {
    if(this.isPrivate && !isSignedIn()) {
      this.router.navigate(['login']);
    }
  }

  constructor(private router: Router){
  }
  
  redirectToLoginOrDashboard() {

    if(isSignedIn()) {
      this.router.navigate(['dashboard']);
    } else {
      this.router.navigate(['login']);
    }
  }
  
}
