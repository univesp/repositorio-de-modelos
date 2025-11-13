import { Component, OnInit } from '@angular/core';
import { ApiHealthService } from '../../services/api-health.service';

@Component({
  selector: 'app-api-status-overlay',
  template: `
    <div *ngIf="!isApiHealthy" class="api-status-overlay">
      <div class="overlay-content">
        <div class="error-icon">⚠️</div>
        <h3>Serviço Indisponível</h3>
        <p>{{ errorMessage }}</p>
        <small>Tentando reconectar automaticamente...</small>
      </div>
    </div>
  `,
  styles: [`
    .api-status-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      color: white;
    }
    .overlay-content {
      background: #d32f2f;
      padding: 2rem;
      border-radius: 8px;
      text-align: center;
      max-width: 400px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    .error-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    h3 {
      margin: 0 0 1rem 0;
      color: white;
    }
    p {
      margin: 0 0 1rem 0;
      line-height: 1.5;
    }
    small {
      opacity: 0.8;
    }
  `]
})
export class ApiStatusOverlayComponent implements OnInit {
  isApiHealthy = true;
  errorMessage = '';

  constructor(private apiHealthService: ApiHealthService) {}

  ngOnInit() {
    this.apiHealthService.isApiHealthy$.subscribe(healthy => {
      this.isApiHealthy = healthy;
      if (!healthy) {
        this.errorMessage = this.apiHealthService.getLastError();
      }
    });
  }
}