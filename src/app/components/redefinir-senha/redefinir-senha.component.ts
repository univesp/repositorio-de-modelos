import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { RecuperacaoSenhaService } from '../../services/recuperacao-senha.service';

@Component({
  selector: 'app-redefinir-senha',
  templateUrl: './redefinir-senha.component.html',
  styleUrls: ['./redefinir-senha.component.scss']
})
export class RedefinirSenhaComponent implements OnInit {
  formularioRedefinicao: FormGroup;
  token: string = '';
  carregando = false;
  tokenInvalido = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private recuperacaoSenhaService: RecuperacaoSenhaService
  ) {
    this.formularioRedefinicao = this.fb.group({
      senha: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]/)
      ]],
      confirmarSenha: ['', Validators.required]
    }, { validators: this.validarSenhasIguais });
  }

  ngOnInit(): void {
    // Tenta pegar o token da query string
    this.route.queryParams.subscribe(params => {
      if (params['token']) {
        this.token = params['token'];
      } else {
        // Se não tiver token na query, verifica se veio de um redirect
        const urlAtual = window.location.href;
        const tokenExtraido = this.recuperacaoSenhaService.extrairTokenDaUrl(urlAtual);
        
        if (tokenExtraido) {
          this.token = tokenExtraido;
          // Limpa a URL para não expor o token
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { token: this.token },
            queryParamsHandling: 'merge'
          });
        } else {
          this.tokenInvalido = true;
          Swal.fire({
            title: 'Erro ao atualizar senha',
            text: 'O link de redefinição está inválido ou expirou. Solicite um novo link de recuperação.',
            icon: 'error',
            confirmButtonText: 'Voltar para login',
            confirmButtonColor: '#f44336'
          }).then(() => {
            this.router.navigate(['/login']);
          });
        }
      }
    });
  }

  validarSenhasIguais(form: FormGroup): { [key: string]: boolean } | null {
    const senha = form.get('senha')?.value;
    const confirmarSenha = form.get('confirmarSenha')?.value;
    
    if (senha && confirmarSenha && senha !== confirmarSenha) {
      return { senhasDiferentes: true };
    }
    return null;
  }

  /*
    Para teste manual no ambiente de desenvolvimento:
    http://localhost:4200/forms/nova-senha?token=SEU_TOKEN_AQUI
  */
  onSubmit(): void {
    if (this.formularioRedefinicao.valid && this.token) {
      this.carregando = true;
      const novaSenha = this.formularioRedefinicao.get('senha')?.value;

      this.recuperacaoSenhaService.redefinirSenha(this.token, novaSenha).subscribe({
        next: () => {
          Swal.fire({
            title: 'Senha alterada com sucesso!',
            text: 'Sua senha foi redefinida com sucesso. Você já pode fazer login com a nova senha.',
            icon: 'success',
            confirmButtonText: 'Ir para login',
            confirmButtonColor: '#7155d8'
          }).then(() => {
            this.router.navigate(['/login']);
          });
        },
        error: (erro) => {
          this.carregando = false;
          console.error('Erro ao redefinir senha:', erro);
          
          let mensagemErro = 'Não foi possível redefinir sua senha.';
          
          if (erro.status === 401 || erro.status === 403) {
            mensagemErro = 'Token inválido ou expirado. Solicite um novo link de recuperação.';
            this.tokenInvalido = true;
          } else if (erro.status === 400) {
            mensagemErro = 'A senha não atende aos requisitos mínimos de segurança.';
          }
          
          Swal.fire({
            title: 'Erro na redefinição ⚠️',
            text: mensagemErro,
            icon: 'error',
            confirmButtonText: 'Entendi',
            confirmButtonColor: '#f44336'
          });
        }
      });
    }
  }

  voltarParaLogin(): void {
    this.router.navigate(['/login']);
  }
}