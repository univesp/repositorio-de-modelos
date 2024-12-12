import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss'
})
export class NotFoundComponent {

  constructor(private router: Router){
  }

  redirectToHome() {
    this.router.navigate(['/'])
      .then(() => {
        window.location.reload();
      });
  }

}
