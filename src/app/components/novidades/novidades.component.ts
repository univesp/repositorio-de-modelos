import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiModelosService } from '../../services/api-modelos.service';
import { ModeloConverterService } from '../../services/modelo-converter.service';

@Component({
  selector: 'app-novidades',
  templateUrl: './novidades.component.html',
  styleUrls: ['./novidades.component.scss']
})
export class NovidadesComponent implements OnInit, OnDestroy {
  cards: any[] = [];
  isLoading = true;
  
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private apiModelosService: ApiModelosService,
    private modeloConverter: ModeloConverterService
  ) {}

  ngOnInit() {
    this.carregarNovidades();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * CARREGA AS NOVIDADES DA API
   */
  carregarNovidades() {
    this.isLoading = true;
    
    this.apiModelosService.getModelosDaAPI()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (modelosAPI) => {
          console.log('📦 Total de modelos da API:', modelosAPI.length);
          
          if (modelosAPI.length > 0) {
            // 1. Pega os 5 últimos modelos (mais recentes)
            const ultimos5 = modelosAPI.slice(-5);
            
            // 2. Inverte a ordem (mais recente primeiro)
            const ultimos5Reversos = ultimos5.reverse();
            
            // 3. Converte para o formato interno
            this.cards = this.modeloConverter.converterArrayAPIparaModelo(ultimos5Reversos);
            
            //console.log('Últimos 5 modelos (ordem reversa):', this.cards.map(c => c.titulo));
          } else {
            this.cards = [];
            //console.log('Nenhum modelo encontrado na API');
          }
          
          this.isLoading = false;
        },
        error: (error) => {
          //console.error('Erro ao carregar novidades:', error);
          this.cards = [];
          this.isLoading = false;
        }
      });
  }

  redirectModeloPage(id: string) {
    this.router.navigate([`modelo/${id}`]);
  }
}