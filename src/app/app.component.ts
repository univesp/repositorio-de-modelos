import { Component, OnInit } from '@angular/core';
import { IFooter } from './interfaces/footer/footer.interface';
import { UserFooter } from './data/footer-list'; 
import { validUrls } from './utils/valid-urls';
import { ApiHealthService } from './services/api-health.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  footer: IFooter = UserFooter[0];

  constructor(private apiHealthService: ApiHealthService) {}

  ngOnInit() {
    // INICIA VERIFICAÇÃO quando app carrega
    this.apiHealthService.initializeHealthCheck();
  }
}
