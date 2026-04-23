import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import Swal from 'sweetalert2';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

// O que a API RETORNA no login (todos os dados)
export interface LoginApiResponse {
  type: string;
  token: string;
  email: string;
  id: number;
  mongoId: string;
  firstname: string;
  lastname: string;
  nome: string;
  imagemFileId: string | null;
  imagemUrl: string | null;
  instituicao: string;
  cargo: string;
}

// O que NÓS SALVAMOS no localStorage (apenas token e type)
export interface LoginResponse {
  type: string;
  token: string;
}

// Interface para dados completos do usuário (endpoint separado)
export interface UserProfile {
  mongoId: string;
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  nome: string;
  imagemFileId: string | null;
  imagemUrl: string | null;
  instituicao: string;
  cargo: string;
  criados: string[];
  salvos: string[];
}

// Interface para resposta do upload/delete de imagem
export interface ImageResponse {
  _id: string;
  imagemFileId: string | null;
  imagemUrl: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = environment.apiBaseUrl;
  private apiUrl = `${this.baseUrl}/auth/login`;
  private userApiUrl = `${this.baseUrl}/usuarios/me`;

  // SUBJECT para gerenciar o estado do usuário
  private userProfileSubject = new BehaviorSubject<UserProfile | null>(null);
  public userProfile$ = this.userProfileSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.isSignedIn());

  // CONTROLE PARA EVITAR MÚLTIPLAS RECARREGAS
  private isCheckingResume = false;

  // ✅ CONTROLE para evitar múltiplos avisos de token expirado
  private warningShown = false;

  constructor(
    private http: HttpClient, 
    private router: Router, 
    private snackBar: MatSnackBar
    ) {
      // Verifica se precisa recarregar página quando volta da suspensão
      this.setupResumeDetection();
      
      // ✅ INICIA MONITORAMENTO do token
      this.startTokenMonitor();
    }

  // ✅ MÉTODOS NOVOS PARA CONTROLE DE TOKEN EXPIRADO

  /**
   * DECODIFICA O JWT PARA VERIFICAR EXPIRAÇÃO
   */
  private decodeJWT(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  /**
   * VERIFICA SE O TOKEN ESTÁ EXPIRADO
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;
    
    const payload = this.decodeJWT(token);
    if (!payload || !payload.exp) return false;
    
    const now = Date.now() / 1000;
    const isExpired = payload.exp < now;
    
    /*
    console.log('Verificação token expirado:', {
      expirado: isExpired,
      expiraEm: new Date(payload.exp * 1000),
      agora: new Date()
    });
    */
    
    return isExpired;
  }

  /**
   * MONITORAMENTO PERIÓDICO DO TOKEN
   */
  private startTokenMonitor(): void {
    // Verifica a cada 1 minuto
    setInterval(() => {
      if (this.isSignedIn() && this.isTokenExpired() && !this.warningShown) {
        this.showTokenExpiredWarning();
      }
    }, 60 * 1000); // 1 minuto
  }

  /**
   * AVISO DE TOKEN EXPIRADO (NÃO DESLOGA AUTOMATICAMENTE)
   */
  showTokenExpiredWarning(): void {
    if (this.warningShown) return;
    
    this.warningShown = true;
    //console.log('Token expirado - Mostrando aviso SweetAlert2');

    Swal.fire({
      icon: 'warning',
      title: 'Sessão Expirada',
      html: `
        <div style="text-align: left;">
          <p>Sua sessão expirou. Algumas funcionalidades podem não funcionar corretamente.</p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Você pode continuar navegando</li>
            <li>Funcionalidades que exigem API podem falhar</li>
            <li>Recomendamos fazer login novamente</li>
          </ul>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Fazer Login',
      cancelButtonText: 'Continuar Navegando',
      confirmButtonColor: '#2196F3',
      cancelButtonColor: '#6c757d',
      backdrop: true,
      allowOutsideClick: false,
      allowEscapeKey: false,
      customClass: {
        popup: 'token-expired-swal',
        confirmButton: 'swal-confirm-btn',
        cancelButton: 'swal-cancel-btn'
      }
    }).then((result) => {
      this.warningShown = false;
      
      if (result.isConfirmed) {
        // ✅ AGORA FAZ LOGOUT E REDIRECIONA PARA LOGIN
        this.redirectToLoginWithLogout();
      }
    });

    // Reseta o aviso após 15 segundos
    setTimeout(() => {
      this.warningShown = false;
    }, 15000);
  }

   /**
   * FAZ LOGOUT E REDIRECIONA PARA LOGIN
   */
   private redirectToLoginWithLogout(): void {
    const currentUrl = this.router.url;
    //console.log('Redirecionando para login com logout, voltará para:', currentUrl);
    
    // Faz logout para limpar tudo
    this.logout();
    
    // Redireciona para login com returnUrl
    this.router.navigate(['/login'], { 
      queryParams: { returnUrl: currentUrl } 
    });
  }

  /**
   * SÓ DESLOGA QUANDO A API REJEITAR (401)
   */
  handleTokenExpired(): void {
    //console.log('API rejeitou token expirado, fazendo logout...');
    
    this.logout();
    this.snackBar.open('Sessão expirada. Faça login novamente.', 'OK', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
    
    this.router.navigate(['/login']);
  }

   /**
   * DETECÇÃO DE SUSPENSÃO/RETORNO
   */
   private setupResumeDetection(): void {
    let suspendTime: number | null = null;
    
    // Evento quando a página está prestes a ser suspensa
    window.addEventListener('beforeunload', () => {
      suspendTime = Date.now();
    });

    // MÚLTIPLOS eventos para detectar retorno da suspensão
    const resumeEvents = [
      'focus',
      'mouseenter',
      'mousemove',
      'keydown',
      'touchstart'
    ];

    resumeEvents.forEach(eventType => {
      window.addEventListener(eventType, () => {
        this.handlePossibleResume();
      }, { once: true, passive: true });
    });

    // Também usa visibilitychange como backup
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.handlePossibleResume();
      }
    });

    // Verificação periódica de segurança
    setInterval(() => {
      this.checkAuthConsistency();
    }, 30000); // A cada 30 segundos
  }

  /**
   * VERIFICA SE PRECISA RECARREGAR
   */
  private handlePossibleResume(): void {
    if (this.isCheckingResume) return;
    
    this.isCheckingResume = true;
    
    // Pequeno delay para garantir que os eventos estabilizaram
    setTimeout(() => {
      this.checkAuthConsistency();
      this.isCheckingResume = false;
    }, 1000);
  }

  /**
   * VERIFICA CONSISTÊNCIA E RECARREGA SE NECESSÁRIO
   */
  private checkAuthConsistency(): void {
    // ⚠️ NÃO VERIFICA CONSISTÊNCIA EM ROTAS DE MODELO
    if (window.location.pathname.includes('/modelo/')) {
        //console.log('Ignorando verificação de consistência na rota de modelo');
        return;
    }
    
    const hasToken = this.isSignedIn();
    const hasProfile = this.userProfileSubject.value !== null;
    
    /*
    console.log('Verificação de consistência Auth:', {
        hasToken,
        hasProfile,
        url: window.location.pathname
    });
    */

    // COMENTE A RECARGA
    if (hasToken && !hasProfile) {
        //console.log('Estado inconsistente: tem token mas não tem perfil');
        // Não recarrega
    }

    if (hasToken && hasProfile) {
        this.checkForPageErrors();
    }
}

  /**
   * VERIFICA SE HÁ ELEMENTOS DE ERRO NA PÁGINA
   */
  private checkForPageErrors(): void {
    // Verifica se há mensagens de erro comuns
    const errorSelectors = [
      '.global-error',
      '.api-error',
      'critical-error',
    ];

    const hasVisibleErrors = errorSelectors.some(selector => {
      const elements = document.querySelectorAll(selector);
      return Array.from(elements).some(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
    });

    if (hasVisibleErrors) {
      //console.log('Erros visíveis detectados na página, recarregando...');
      this.triggerPageReload();
    }
  }

  /**
   * DISPARA RECARGA DA PÁGINA COM FEEDBACK
   */
  private triggerPageReload(): void {
    // Mostra feedback visual para o usuário
    this.snackBar.open('Restaurando aplicação...', 'Fechar', {
      duration: 3000,
      panelClass: ['reload-snackbar']
    });

    // Recarrega após um pequeno delay para o usuário ver a mensagem
    setTimeout(() => {
      //console.log('Recarregando página...');
      window.location.reload();
    }, 1000);
  }

  login(credentials: LoginRequest): Observable<LoginApiResponse> {
   // console.log('Enviando login para:', this.apiUrl);
   // console.log('Email:', credentials.email);
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    return this.http.post<LoginApiResponse>(this.apiUrl, credentials, { headers })
      .pipe(
        tap(response => {
         // console.log('Login bem-sucedido! API retornou:', response);
          
          // ABORDAGEM LIMPA: Extrai APENAS o que precisamos salvar
          const tokenData: LoginResponse = {
            type: response.type,
            token: response.token
          };
          
          this.setAuthData(tokenData);
          this.setAuthentication(true);
         // console.log('Salvo no localStorage:', tokenData);

         // CORREÇÃO: Carrega o perfil automaticamente após login
       // console.log('Login bem-sucedido, carregando perfil...');
        this.getUserProfile().subscribe(); // Dispara o carregamento do perfil
        
        // RESETA aviso ao fazer novo login
        this.warningShown = false;
        })
      );
  }

  // Buscar dados completos do usuário E atualizar o subject
  getUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.userApiUrl).pipe(
      tap(profile => {
        this.userProfileSubject.next(profile);
      })
    );
  }

  // Buscar imagem como blob
  getProfileImage(mongoId: string): Observable<Blob> {
   // console.log('Buscando imagem do perfil para:', mongoId);
    return this.http.get(`/api/usuarios/${mongoId}/imagem`, { responseType: 'blob' });
  }

  // Obter perfil atual (sync)
  getCurrentUserProfile(): UserProfile | null {
    return this.userProfileSubject.value;
  }

  // Upload de imagem de perfil do usuário + atualização automática
  uploadProfileImage(mongoId: string, imageFile: File): Observable<ImageResponse> {
    const formData = new FormData();
    formData.append('file', imageFile);

   // console.log('Upload de imagem para usuário:', mongoId);
    
    return this.http.put<ImageResponse>(`/api/usuarios/${mongoId}/imagem`, formData).pipe(
      tap(response => {
        // Atualiza automaticamente o perfil local
        this.updateUserProfile({
          imagemFileId: response.imagemFileId,
          imagemUrl: response.imagemUrl
        });
      })
    );
  }

  // Atualiza dados locais do usuário (após upload/delete)
  updateUserProfile(updatedProfile: Partial<UserProfile>): void {
    const currentProfile = this.userProfileSubject.value;
    
    if (currentProfile) {
       // Usa setTimeout para sair do ciclo atual e evitar race conditions
      setTimeout(() => {
        const newProfile = {
          ...currentProfile,
          ...updatedProfile
        };
        this.userProfileSubject.next(newProfile);
      }, 0);
    }
  }

  // Remover imagem de perfil do usuário + atualização automática
  removeProfileImage(mongoId: string): Observable<ImageResponse> {
   // console.log('Removendo imagem do usuário:', mongoId);
    
    return this.http.delete<ImageResponse>(`/api/usuarios/${mongoId}/imagem`).pipe(
      tap(response => {
        // Atualiza automaticamente o perfil local
        this.updateUserProfile({
          imagemFileId: null,
          imagemUrl: null
        });
      })
    );
  }

  // MÉTODOS DE AUTENTICAÇÃO
  logout(): void {
    //console.log('AuthService: Fazendo logout...');
    
    // 1. PRIMEIRO limpa o perfil do usuário
    this.userProfileSubject.next(null);
    
    // 2. DEPOIS limpa a autenticação
    this.setAuthentication(false);
    localStorage.removeItem('authData');
    
    // RESETA aviso ao fazer logout
    this.warningShown = false;
    
   // console.log('AuthService: Logout concluído');
  }

  private setAuthentication(status: boolean): void {
    localStorage.setItem('isSignedIn', status.toString());
    this.isAuthenticatedSubject.next(status);
  }

  private setAuthData(authData: LoginResponse): void {
    localStorage.setItem('authData', JSON.stringify(authData));
  }

  getAuthData(): LoginResponse | null {
    const data = localStorage.getItem('authData');
    return data ? JSON.parse(data) : null;
  }

  getToken(): string | null {
    const data = this.getAuthData();
    return data ? data.token : null;
  }

  isSignedIn(): boolean {
    const signedIn = localStorage.getItem('isSignedIn');
    const token = this.getToken();
    return signedIn === 'true' && !!token;
  }

  isAuthenticated(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  getAuthStatus(): boolean {
    return this.isAuthenticatedSubject.value;
  }
}