import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../services/auth.service';
import { LoginComponent as LoginFormComponent } from '../../components/login/login.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  @ViewChild(LoginFormComponent) loginFormComponent!: LoginFormComponent;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    if (this.authService.isSignedIn()) {
      this.router.navigate(['/']);
    }
  }

  onLogin(credentials: { email: string; password: string }) {
    this.authService.login(credentials).subscribe({
      next: (response) => {
        console.log('Login realizado com sucesso!', response);
        
        // Verifica se está realmente autenticado
        console.log('isSignedIn após login:', this.authService.isSignedIn());
        
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Erro no login:', error);
        
        // RESETA o loading do formulário
        this.loginFormComponent.resetLoading();
        
        // Verifica que NÃO está autenticado
        console.log('isSignedIn após erro:', this.authService.isSignedIn());
        
                // SWEETALERTS DE ERRO
                if (error.status === 401) {
                  Swal.fire({
                    title: 'Erro no login ❌',
                    text: 'Email ou senha incorretos',
                    icon: 'error',
                    confirmButtonText: 'Tentar novamente',
                    confirmButtonColor: '#f44336'
                  });
                } else if (error.status === 400) {
                  Swal.fire({
                    title: 'Dados inválidos ⚠️',
                    text: 'Verifique os campos e tente novamente',
                    icon: 'warning',
                    confirmButtonText: 'Corrigir',
                    confirmButtonColor: '#f44336'
                  });
                } else if (error.status === 0) {
                  Swal.fire({
                    title: 'Erro de conexão 🌐',
                    text: 'Não foi possível conectar ao servidor',
                    icon: 'error',
                    confirmButtonText: 'Tentar novamente',
                    confirmButtonColor: '#f44336'
                  });
                } else {
                  Swal.fire({
                    title: 'Erro inesperado 🚨',
                    text: 'Tente novamente em alguns instantes',
                    icon: 'error',
                    confirmButtonText: 'Entendi',
                    confirmButtonColor: '#f44336'
                  });
                }
      }
    });
  }
}