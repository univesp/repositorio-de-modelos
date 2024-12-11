import { Component, OnInit } from '@angular/core';
import { IFooter } from './interfaces/footer/footer.interface';
import { UserFooter } from './data/footer-list'; 

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  footer: IFooter = UserFooter[0];

  ngOnInit() {
    if(!localStorage.getItem('isSignedIn')) {
      localStorage.setItem('isSignedIn', 'false');
    }
  }
}
