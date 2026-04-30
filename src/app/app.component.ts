import { Component, OnInit } from '@angular/core';
import { IFooter } from './interfaces/footer/footer.interface';
import { UserFooter } from './data/footer-list'; 
import { validUrls } from './utils/valid-urls';
import { ApiHealthService } from './services/api-health.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  footer: IFooter = UserFooter[0];

  constructor(
    private apiHealthService: ApiHealthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.apiHealthService.initializeHealthCheck();

    // verifica e corrige a URL atual
    const currentUrl = window.location.href;
    const hashIndex = currentUrl.indexOf('#');
    
    // Se não tem # e não é a raiz
    if (hashIndex === -1 && !currentUrl.endsWith('/')) {
      // Pega o caminho atual
      const path = window.location.pathname;
      const basePath = '/_testes/repositorio-de-modelos';
      
      // Extrai a rota (ex: /login, /explorar)
      let route = path.replace(basePath, '');
      if (route === '') route = '/';
      
      // Redireciona para a versão com #
      const newUrl = `${window.location.origin}${basePath}/#${route}`;
      console.log('Redirecionando para:', newUrl);
      window.location.href = newUrl;
    }
  }
}