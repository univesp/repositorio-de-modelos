import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { isSignedIn } from '../../utils/get-signedin'; 
import { ICarousel } from '../../interfaces/carousel/carousel.interface';
import { SlidesCarousel } from '../../data/carousel-list';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  slides: ICarousel = SlidesCarousel[0];

  ngOnInit() {
    if(this.isPrivate && !isSignedIn()) {
      this.router.navigate(['login']);
    }
  }

  constructor(private router: Router){
  }

  isPrivate: boolean = true;

}
