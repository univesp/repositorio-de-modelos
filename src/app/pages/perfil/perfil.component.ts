import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, UserProfile } from '../../services/auth.service'; // MUDEI A IMPORT

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {

  userData: UserProfile | null = null; // MUDEI O TIPO
  isLoading: boolean = true; // ADICIONEI LOADING
  error: string = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadUserProfile(); // MUDEI O NOME DO MÉTODO
  }

  // NOVO MÉTODO: Busca dados da API
  loadUserProfile(): void {
    this.isLoading = true;
    this.error = '';

    this.authService.getUserProfile().subscribe({
      next: (profile) => {
        this.userData = profile;
        this.isLoading = false;
        //console.log('Dados do usuário carregados:', this.userData);
      },
      error: (error) => {
        console.error('Erro ao carregar perfil:', error);
        this.error = 'Erro ao carregar dados do usuário';
        this.isLoading = false;
        this.router.navigate(['/']);
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  // Método auxiliar para pegar o username do email
  getUserName(): string {
    if(!this.userData?.email) return 'usuário';
    return this.userData.email.split('@')[0];
  }

  // Método auxiliar para a primeira letra do nome
  getUserInitial(): string {
    if(!this.userData?.nome) return 'U';
    return this.userData.nome.charAt(0).toUpperCase();
  }
}