import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { isSignedIn } from '../../utils/get-signedin';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  isPrivate: boolean = false;

  ngOnInit() {
    if(isSignedIn()) {
      this.router.navigate(['/']);
    }
  }

  constructor(private router: Router){
  }

  onLogin(isSignedIn: boolean) {
    localStorage.setItem('isSignedIn', isSignedIn.toString());
    window.location.reload();
  }

}
