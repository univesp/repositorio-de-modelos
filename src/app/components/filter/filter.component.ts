import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss'
})
export class FilterComponent {
  goToExplorar() {
    this.router.navigate(['explorar']);
  }
  constructor(private router: Router){
  }
}
