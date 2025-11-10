import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UsuariosService, NovoUsuario } from '../../services/usuarios.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-criar-usuario',
  templateUrl: './criar-usuario.component.html',
  styleUrls: ['./criar-usuario.component.scss']
})
export class CriarUsuarioComponent {
  @Output() usuarioCriado = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

  usuarioForm: FormGroup;
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private usuariosService: UsuariosService
  ) {
    this.usuarioForm = this.criarForm();
  }

  private criarForm(): FormGroup {
    return this.fb.group({
      firstname: ['', [Validators.required, Validators.minLength(2)]],
      lastname: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['USER', Validators.required],
      instituicao: ['UNIVESP', Validators.required],
      cargo: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.usuarioForm.valid) {
      this.isLoading = true;

      const usuarioData: NovoUsuario = this.usuarioForm.value;
      
      this.usuariosService.criarUsuario(usuarioData).subscribe({
        next: (response) => {
          this.isLoading = false;

          Swal.fire({
            title: 'Sucesso! ✅',
            text: 'Usuário criado com sucesso',
            icon: 'success',
            confirmButtonText: 'Ok',
            confirmButtonColor: '#7155d8'
          });

          // Reset do formulário
          this.usuarioForm.reset({ role: 'USER', instituicao: 'UNIVESP' });

          // Emite evento de sucesso
          this.usuarioCriado.emit();
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Erro ao criar usuário:', error);

          this.tratarErro(error);
          
        }
      });
    } else {
      this.marcarCamposComoVisitados();
    }
  }

  private tratarErro(error: any): void {
    let mensagemErro = 'Erro ao criar usuário';
    
    switch (error.status) {
      case 400:
        mensagemErro = 'Dados inválidos. Verifique as informações.';
        break;
      case 401:
        mensagemErro = 'Acesso não autorizado. Faça login novamente.';
        break;
      case 403:
        mensagemErro = 'Você não tem permissão para criar usuários.';
        break;
      case 409:
        mensagemErro = 'Já existe um usuário com este email.';
        break;
      case 500:
        mensagemErro = 'Erro interno do servidor. Tente novamente mais tarde.';
        break;
      default:
        mensagemErro = 'Erro ao conectar com o servidor. Verifique sua conexão.';
    }

    Swal.fire({
      title: 'Erro ❌',
      text: mensagemErro,
      icon: 'error',
      confirmButtonText: 'Tentar novamente',
      confirmButtonColor: '#f44336'
    });
  }

  private marcarCamposComoVisitados(): void {
    Object.keys(this.usuarioForm.controls).forEach(key => {
      this.usuarioForm.get(key)?.markAsTouched();
    });
  }

  onCancel(): void {
    this.cancelar.emit();
  }

  // Getters para facilitar o acesso no template
  get firstname() { return this.usuarioForm.get('firstname'); }
  get lastname() { return this.usuarioForm.get('lastname'); }
  get email() { return this.usuarioForm.get('email'); }
  get password() { return this.usuarioForm.get('password'); }
  get role() { return this.usuarioForm.get('role'); }
  get instituicao() { return this.usuarioForm.get('instituicao'); }
  get cargo() { return this.usuarioForm.get('cargo'); }
}