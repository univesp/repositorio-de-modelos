import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service'; 
import { LoginResponse } from '../../services/auth.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss'
})
export class PerfilComponent implements OnInit {

  userData: LoginResponse | null = null;
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.userData = this.authService.getAuthData();

    if(!this.userData) {
      console.warn('Nenhum dado de usuário encontrado');
      // Redireciona para a Dashboard se NÃO estiver logado
      this.router.navigate(['/']);
    }

    console.log('Dados do usuário carregados:', this.userData)
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/'])
  }

  // Método auxiliar para pegar o username do email
  getUserName(): string {
    if(!this.userData?.email) return 'usuário';
    return this.userData?.email.split('@')[0];
  }

  // Método auxiliar para a primeira letra do nome
  getUserInitial(): string {
    if(!this.userData?.nome) return 'U';
    return this.userData.nome.charAt(0).toUpperCase();
  }

}
