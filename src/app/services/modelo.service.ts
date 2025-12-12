import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { AuthService } from './auth.service';
import { map, catchError } from 'rxjs/operators';

export interface ModeloCreateRequest {
  ano: number;
  mes: number;
  dia: number;
  date: string;
  formato: string;
  titulo: string;
  descricao: string;
  link: string;
  tags: string[];
  curso: string[];
  area: string[];
  tipo: string[];
  tecnologias: string[];
  acessibilidade: string[];
  licenca: string[];
  hasCodigo: boolean;
  codigoLink?: string;
  hasEquipe: boolean;
  equipe?: {
    docente: string;
    coordenacao: string;
    roteirizacao: string;
    layout: string;
    ilustracao: string;
    programacao: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ModeloService {
  private apiUrl = '/api/modelos';
  private BASEURL = 'https://apps.univesp.br/repositorio-modelos';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  criarModelo(modelo: ModeloCreateRequest): Observable<any> {
    const token = this.authService.getToken();
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `${this.authService.getAuthData()?.type} ${token}`
    });

    return this.http.post(this.apiUrl, modelo, { headers });
  }

  verificarTituloExistente(titulo: string): Observable<boolean> {
    return this.http.get<any[]>(`${this.BASEURL}/modelos/list`).pipe(
      map(modelos => {
        const tituloNormalizado = titulo.toLowerCase().trim();
        return modelos.some(modelo => 
          modelo.titulo.toLowerCase().trim() === tituloNormalizado
        );
      }),
      catchError(error => {
        console.error('Erro ao verificar título:', error);
        return of(false); // Em caso de erro, permite enviar
      })
    );
  }
}