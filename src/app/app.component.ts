import { Component, OnInit } from '@angular/core';
import { IFooter } from './interfaces/footer/footer.interface';
import { UserFooter } from './data/footer-list'; 
import { validUrls } from './utils/valid-urls';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  footer: IFooter = UserFooter[0];
  paginaValida: boolean = true;

  ngOnInit() {
    setTimeout(() => {window.scrollTo({
      top: 0,
      behavior: "smooth",
    });}, 20)
    
    if(!localStorage.getItem('isSignedIn')) {
      localStorage.setItem('isSignedIn', 'false');
    }

    let currentURL = window.location.pathname;
    
    validUrls.map((urlValida) => {
      currentURL === urlValida || currentURL === '/' ? this.paginaValida = true : this.paginaValida = false;
    })
  }
}
