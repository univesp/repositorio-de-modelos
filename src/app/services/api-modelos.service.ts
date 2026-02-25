import { Injectable } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';

import { ModeloAPI } from '../interfaces/modelo/modelo-api.interface';
import { ImagemDefaultUtils } from '../utils/imagem-default.utils';

import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiModelosService {

  private httpWithoutInterceptors: HttpClient;
  private baseUrl = environment.apiBaseUrl;
  
  constructor(
    private http: HttpClient,
    private router: Router,
    private handler: HttpBackend
  ) {
    this.httpWithoutInterceptors = new HttpClient(handler);
  }

  /**
   * Obtém modelos da API - RETORNA ModeloAPI[] DIRETO
   */
  getModelosDaAPI(): Observable<ModeloAPI[]> {
    return this.http.get<ModeloAPI[]>(`${this.baseUrl}/modelos/list`)
      .pipe(
        catchError(error => {
          console.error('ERRO NA API:', error);
          return of([]);
        })
      );
  }

  /**
   * Método adicional: Retorna já convertido com imagens default
   */
  getModelosConvertidos(): Observable<any[]> {
    return this.http.get<ModeloAPI[]>(`${this.baseUrl}/modelos/list`)
      .pipe(
        map(apiModelos => this.converterComImagensDefault(apiModelos)),
        catchError(error => {
          console.error('ERRO NA API:', error);
          return of([]);
        })
      );
  }

  /**
   * Converte ModeloAPI[] adicionando propriedades de imagem
   */
  private converterComImagensDefault(apiModelos: ModeloAPI[]): any[] {
    return apiModelos.map(apiModelo => {
      const imagem = ImagemDefaultUtils.getImagemParaExibicao(apiModelo);
      return {
        ...apiModelo,
        img_sm: imagem,
        img_md: imagem,
        img_lg: imagem,
        recurso: apiModelo.formato,
        disciplina: apiModelo.curso?.[0] || 'Disciplina não especificada',
        hasMobile: false,
        isSalvo: false
      };
    });
  }

  /**
   * Obtém UM modelo específico por ID da API
   */
  getModeloPorIdDaAPI(id: string): Observable<ModeloAPI | null> {
    //console.log(`Buscando modelo ${id} SEM INTERCEPTORS`);
    
    return this.httpWithoutInterceptors.get<ModeloAPI>(`${this.baseUrl}/modelos/${id}`)
      .pipe(
        catchError(error => {
          console.error(`ERRO ao buscar modelo ${id}:`, error.status);
          
          if (error.status === 404) {
            //console.log(`Modelo ${id} não existe`);
            // ⚠️ LANÇA O ERRO PARA O COMPONENTE CAPTURAR
            return throwError(() => ({ 
              status: 404, 
              id: id,
              message: 'Modelo não encontrado' 
            }));
          }
          
          // Para outros erros, retorna null
          return of(null);
        })
      );
  }

  /**
   * Busca modelos com carousel=true da API
   */
  getModelosCarouselDaAPI(): Observable<ModeloAPI[]> {
    return this.http.get<ModeloAPI[]>(`${this.baseUrl}/modelos/list?carousel=true`).pipe(
      catchError(error => {
        console.error('Erro ao buscar modelos do carrossel:', error);
        return of([]);
      })
    );
  }

  /**
   * Busca modelos com destaque=true da API
   */
  getModelosDestaqueDaAPI(): Observable<ModeloAPI[]> {
    return this.http.get<ModeloAPI[]>(`${this.baseUrl}/modelos/list?destaque=true`).pipe(
      catchError(error => {
        console.error('Erro ao buscar modelos em destaque:', error);
        return of([]);
      })
    );
  }
}