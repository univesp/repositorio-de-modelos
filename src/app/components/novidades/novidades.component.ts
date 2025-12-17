import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Modelo } from '../../interfaces/modelo/modelo.interface';
import { ApiModelosService } from '../../services/api-modelos.service';
import { ModeloConverterService } from '../../services/modelo-converter.service';
import { UploadImagemService } from '../../services/upload-imagem.service';

@Component({
  selector: 'app-novidades',
  templateUrl: './novidades.component.html',
  styleUrls: ['./novidades.component.scss']
})
export class NovidadesComponent implements OnInit, OnDestroy {
  cards: any[] = [];
  isLoading = true;
  
  private destroy$ = new Subject<void>();

  // Cache simples de imagens
  private imagensCache = new Map<string, string>();
  // Controla quais imagens estão sendo carregadas
  private carregandoImagens = new Set<string>();

  constructor(
    private router: Router,
    private apiModelosService: ApiModelosService,
    private modeloConverter: ModeloConverterService,
    private uploadImagemService: UploadImagemService
  ) {}

  ngOnInit() {
    this.carregarNovidades();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    // LIMPEZA DAS URLS DE BLOB
    this.imagensCache.forEach(url => {
      URL.revokeObjectURL(url);
    });
    this.imagensCache.clear();
    this.carregandoImagens.clear();
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

  /**
 * Retorna a imagem do cache ou inicia o carregamento
 */
  obterImagemParaModelo(modelo: Modelo): string {
    const modeloId = modelo.id;
    
    // 1. Se já tem no cache, retorna
    if (this.imagensCache.has(modeloId)) {
      return this.imagensCache.get(modeloId)!;
    }
    
    // 2. Se não está carregando, inicia o carregamento
    if (!this.carregandoImagens.has(modeloId)) {
      this.carregandoImagens.add(modeloId);
      
      this.uploadImagemService.getImagemModelo(modeloId).subscribe({
        next: (blob) => {
          // Cria URL e salva no cache
          const url = URL.createObjectURL(blob);
          this.imagensCache.set(modeloId, url);
          this.carregandoImagens.delete(modeloId);
        },
        error: (error) => {
          // Se erro, remove do set de carregamento
          this.carregandoImagens.delete(modeloId);
        }
      });
    }
    
    // 3. Enquanto carrega ou se der erro, retorna a imagem padrão
    return modelo.img_lg || 'assets/images/placeholder-modelo.svg';
  }

  redirectModeloPage(id: string) {
    this.router.navigate([`modelo/${id}`]);
  }
}