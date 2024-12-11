import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  getIsSignedIn: any = localStorage.getItem('isSignedIn');
  isSignedIn: boolean = false;
  isPrivate: boolean = false;

  ngOnInit() {
    if(this.isPrivate) {
      this.router.navigate(['login']);
    }
  }

  constructor(private router: Router){
  }
  
  redirectToLoginOrDashboard() {
    this.getIsSignedIn === "false" ? this.isSignedIn = false : this.isSignedIn = true;
    
    if(this.isSignedIn) {
      this.router.navigate(['dashboard']);
    } else {
      this.router.navigate(['login']);
    }
  }
}
