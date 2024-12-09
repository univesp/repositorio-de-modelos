import { Component } from '@angular/core';
import { IFooter } from './interfaces/footer/footer.interface';
import { UserFooter } from './data/footer-list'; 

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  footer: IFooter = UserFooter[0];
}
