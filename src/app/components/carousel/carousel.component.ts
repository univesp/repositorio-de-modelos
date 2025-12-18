import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Modelo } from '../../interfaces/modelo/modelo.interface';
import { Modeloslist } from '../../data/modelos-list';
import { ApiModelosService } from '../../services/api-modelos.service';
import { ModeloConverterService } from '../../services/modelo-converter.service';
import { UploadImagemService } from '../../services/upload-imagem.service';

@Component({
  selector: 'app-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.scss'],
})
export class CarouselComponent implements OnInit, OnDestroy {
  
  @Input({required: true}) modelosList: Modelo[] = Modeloslist;
  slides: Modelo[] = [];
  isLoading: boolean = true;
  
  private destroy$ = new Subject<void>();
  
  // Cache de imagens customizadas
  private imagensCache = new Map<string, string>();
  private carregandoImagens = new Set<string>();

  constructor(
    private router: Router,
    private apiModelosService: ApiModelosService,
    private modeloConverterService: ModeloConverterService,
    private uploadImagemService: UploadImagemService
  ) {}

  redirectModeloPage(id: string) {
    this.router.navigate([`modelo/${id}`]);
  }

  ngOnInit() {
    this.carregarCarouselDaAPI();
  }
  
  ngOnDestroy() {
    // Limpa memória dos blobs
    this.imagensCache.forEach(url => URL.revokeObjectURL(url));
    this.imagensCache.clear();
    this.carregandoImagens.clear();
    
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * CARREGA OS SLIDES DO CARROSSEL DA API
   */
  carregarCarouselDaAPI(): void {
    this.isLoading = true;
    
    this.apiModelosService.getModelosCarouselDaAPI()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (modelosAPI) => {
          console.log('🎠 Modelos do carrossel da API:', modelosAPI.length);
          
          if (modelosAPI.length > 0) {
            // Converte para o formato interno
            this.slides = this.modeloConverterService.converterArrayAPIparaModelo(modelosAPI);
            
            // Limita a 5 slides (como estava antes)
            if (this.slides.length > 5) {
              this.slides = this.slides.slice(0, 5);
            }
            
            // PRÉ-CARREGA IMAGENS DOS SLIDES
            this.preCarregarImagens(this.slides);
            
            console.log('✅ Carrossel carregado:', this.slides.map(s => s.titulo));
          } else {
            this.slides = [];
            console.log('ℹ️ Nenhum modelo no carrossel');
          }
          
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Erro ao carregar carrossel:', error);
          this.slides = [];
          this.isLoading = false;
        }
      });
  }

  /**
   * PRÉ-CARREGA IMAGENS DOS MODELOS
   */
  private preCarregarImagens(modelos: Modelo[]): void {
    modelos.forEach(modelo => {
      if (!this.imagensCache.has(modelo.id) && !this.carregandoImagens.has(modelo.id)) {
        this.carregandoImagens.add(modelo.id);
        
        this.uploadImagemService.getImagemModelo(modelo.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (blob) => {
              const url = URL.createObjectURL(blob);
              this.imagensCache.set(modelo.id, url);
              this.carregandoImagens.delete(modelo.id);
            },
            error: () => {
              this.carregandoImagens.delete(modelo.id);
            }
          });
      }
    });
  }

  /**
   * OBTÉM IMAGEM PARA UM MODELO
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
      
      this.uploadImagemService.getImagemModelo(modeloId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (blob) => {
            const url = URL.createObjectURL(blob);
            this.imagensCache.set(modeloId, url);
            this.carregandoImagens.delete(modeloId);
          },
          error: () => {
            this.carregandoImagens.delete(modeloId);
          }
        });
    }
    
    // 3. Enquanto carrega ou se der erro, retorna a imagem padrão do modelo
    return modelo.img_lg || 'assets/images/placeholder-modelo.svg';
  }
  
  
  slideConfig = {
    "slidesToShow": 1,
    "slidesToScroll": 1,
    "autoplay": true,
    "autoplaySpeed": 5000,
    "pauseOnHover": true,
    "infinite": true,
    "dots": true,
    "dotsClass": "slick-dots custom-dots",
    responsive: [
      {
        breakpoint: 1200, 
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: false,
          dots: true
        }
      },
      {
        breakpoint: 992,   
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: false,
          dots: true
        }
      },
      {
        breakpoint: 768,   
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: false,
          dots: true
        }
      }
    ]
  };
}