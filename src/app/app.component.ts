import { Component, OnInit } from '@angular/core';
import { IFooter } from './interfaces/footer/footer.interface';
import { UserFooter } from './data/footer-list'; 
import { validUrls } from './utils/valid-urls';
import { ApiHealthService } from './services/api-health.service';
import { Router, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  footer: IFooter = UserFooter[0];

  constructor(
    private apiHealthService: ApiHealthService,
    private router: Router,     
    private location: Location  
  ) {}

  ngOnInit() {
    // INICIA VERIFICAÇÃO quando app carrega
    this.apiHealthService.initializeHealthCheck();

    // Garante que as URLs sejam navegáveis mesmo sem hash (apenas para usuários que digitam URL sem #)
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const url = event.urlAfterRedirects;
        // Se a URL não tem hash e não está vazia, redireciona para a versão com hash
        if (!url.startsWith('/#') && url !== '/' && url !== '' && url !== '/?') {
          // Usa setTimeout para evitar conflitos de navegação
          setTimeout(() => {
            if (this.location.path() === url && !window.location.hash) {
              this.router.navigateByUrl('/#' + url, { skipLocationChange: false });
            }
          }, 0);
        }
      }
    });
  }
}