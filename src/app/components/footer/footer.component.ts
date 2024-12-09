import { Component, Input } from '@angular/core';
import { IFooter } from '../../interfaces/footer/footer.interface';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {

  @Input({ required: true }) footer: IFooter = { } as IFooter;

}
