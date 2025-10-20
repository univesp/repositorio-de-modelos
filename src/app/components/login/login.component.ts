import { Component, EventEmitter, Output, signal } from '@angular/core';

@Component({
  selector: 'app-login-component',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  hide = signal(true);
  email = '';
  password = '';
  isLoading = false;

  @Output('onLogin') onLoginEmitt = new EventEmitter<{ email: string; password: string }>();

  clickEvent(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }

  // Getters para facilitar o acesso aos controles
  get emailControl(): any {
    return {
      invalid: !this.isEmailValid(),
      touched: true,
      errors: this.getEmailErrors()
    };
  }

  get passwordControl(): any {
    return {
      invalid: !this.isPasswordValid(),
      touched: true,
      errors: this.getPasswordErrors()
    };
  }

  isFormValid(): boolean {
    return this.isEmailValid() && this.isPasswordValid();
  }

  isEmailValid(): boolean {
    if (!this.email) {
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email);
  }

  isPasswordValid(): boolean {
    // Apenas verifica se a senha não está vazia
    // A validação específica fica a cargo do backend
    return !!this.password && this.password.trim().length > 0;
  }

  getEmailErrors(): any {
    if (!this.email) {
      return { required: true };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      return { email: true };
    }
    return null;
  }

  getPasswordErrors(): any {
    if (!this.password) {
      return { required: true };
    }
    return null;
  }

  onLogin() {
    if (this.isFormValid() && !this.isLoading) {
      this.isLoading = true;
      
      const credentials = {
        email: this.email.trim(),
        password: this.password
      };
      
      this.onLoginEmitt.emit(credentials);
    }
  }

  // Método para resetar o loading (será chamado pelo componente pai)
  resetLoading() {
    this.isLoading = false;
  }
}