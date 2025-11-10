import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { UsuariosService, Usuario, AtualizarUsuario } from '../../services/usuarios.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-visualizar-usuarios',
  templateUrl: './visualizar-usuarios.component.html',
  styleUrls: ['./visualizar-usuarios.component.scss']
})
export class VisualizarUsuariosComponent implements OnInit {
  @Output() cancelar = new EventEmitter<void>();

  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  isLoading: boolean = false;
  
  // Modal de edição
  modalAberto: boolean = false;
  usuarioEditando: Usuario | null = null;
  edicaoForm: FormGroup;
  salvandoEdicao: boolean = false;

  // Filtros
  filtroForm: FormGroup;
  filtroNome: string = '';
  filtroRole: string = '';

  // Paginação
  paginaAtual: number = 1;
  usuariosPorPagina: number = 10;

  constructor(
    private usuariosService: UsuariosService,
    private fb: FormBuilder
  ) {
    this.filtroForm = this.fb.group({
      nome: [''],
      role: ['']
    });

    this.edicaoForm = this.fb.group({
      firstname: ['', [Validators.required, Validators.minLength(2)]],
      lastname: ['', [Validators.required, Validators.minLength(2)]],
      role: ['USER', Validators.required]
    });
  }

  ngOnInit(): void {
    this.carregarUsuarios();
    
    // Observa mudanças nos filtros
    this.filtroForm.valueChanges.subscribe(() => {
      this.aplicarFiltros();
    });
  }

  carregarUsuarios(): void {
    this.isLoading = true;
    
    this.usuariosService.listarUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.usuariosFiltrados = [...usuarios];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar usuários:', error);
        this.isLoading = false;
        Swal.fire({
          title: 'Erro ❌',
          text: 'Erro ao carregar lista de usuários',
          icon: 'error',
          confirmButtonText: 'Tentar novamente',
          confirmButtonColor: '#f44336'
        });
      }
    });
  }

  aplicarFiltros(): void {
    const { nome, role } = this.filtroForm.value;
    
    this.usuariosFiltrados = this.usuarios.filter(usuario => {
      const nomeCompleto = `${usuario.firstname} ${usuario.lastname}`.toLowerCase();
      const correspondeNome = !nome || nomeCompleto.includes(nome.toLowerCase());
      const correspondeRole = !role || usuario.role === role;
      
      return correspondeNome && correspondeRole;
    });
    
    this.paginaAtual = 1; // Reset para primeira página
  }

  limparFiltros(): void {
    this.filtroForm.reset();
    this.usuariosFiltrados = [...this.usuarios];
    this.paginaAtual = 1;
  }

  // Modal de edição
  abrirModalEdicao(usuario: Usuario): void {
    this.usuarioEditando = { ...usuario };
    this.edicaoForm.patchValue({
      firstname: usuario.firstname,
      lastname: usuario.lastname,
      role: usuario.role
    });
    this.modalAberto = true;
  }

  fecharModal(): void {
    this.modalAberto = false;
    this.usuarioEditando = null;
    this.salvandoEdicao = false;
    this.edicaoForm.reset();
  }

  salvarEdicao(): void {
    if (this.edicaoForm.invalid || !this.usuarioEditando) {
      // Marca os campos como touched para mostrar erros
      Object.keys(this.edicaoForm.controls).forEach(key => {
        this.edicaoForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.salvandoEdicao = true;

    const dadosAtualizacao: AtualizarUsuario = {
      firstname: this.edicaoForm.value.firstname,
      lastname: this.edicaoForm.value.lastname,
      role: this.edicaoForm.value.role,
      instituicao: this.usuarioEditando.instituicao,
      cargo: this.usuarioEditando.cargo
    };

    this.usuariosService.atualizarUsuario(this.usuarioEditando._id, dadosAtualizacao).subscribe({
      next: (usuarioAtualizado) => {
        // Atualiza a lista local
        const index = this.usuarios.findIndex(u => u._id === usuarioAtualizado._id);
        if (index !== -1) {
          this.usuarios[index] = usuarioAtualizado;
          this.aplicarFiltros(); // Reaplica filtros para atualizar a lista filtrada
        }

        this.fecharModal();

        Swal.fire({
          title: 'Sucesso! ✅',
          text: 'Usuário atualizado com sucesso',
          icon: 'success',
          confirmButtonText: 'Ok',
          confirmButtonColor: '#7155d8'
        });
      },
      error: (error) => {
        console.error('Erro ao atualizar usuário:', error);
        this.salvandoEdicao = false;
        Swal.fire({
          title: 'Erro ❌',
          text: 'Erro ao atualizar usuário',
          icon: 'error',
          confirmButtonText: 'Tentar novamente',
          confirmButtonColor: '#f44336'
        });
      }
    });
  }

  excluirUsuario(usuario: Usuario): void {
    Swal.fire({
      title: 'Tem certeza?',
      text: `Você está prestes a excluir o usuário ${usuario.firstname} ${usuario.lastname}. Esta ação não pode ser desfeita!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f44336',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.usuariosService.removerUsuario(usuario._id).subscribe({
          next: () => {
            // Remove da lista local
            this.usuarios = this.usuarios.filter(u => u._id !== usuario._id);
            this.aplicarFiltros(); // Reaplica filtros

            Swal.fire({
              title: 'Excluído! ✅',
              text: 'Usuário excluído com sucesso',
              icon: 'success',
              confirmButtonText: 'Ok',
              confirmButtonColor: '#7155d8'
            });
          },
          error: (error) => {
            console.error('Erro ao excluir usuário:', error);
            Swal.fire({
              title: 'Erro ❌',
              text: 'Erro ao excluir usuário',
              icon: 'error',
              confirmButtonText: 'Tentar novamente',
              confirmButtonColor: '#f44336'
            });
          }
        });
      }
    });
  }

  // Paginação
  get usuariosPaginados(): Usuario[] {
    const startIndex = (this.paginaAtual - 1) * this.usuariosPorPagina;
    return this.usuariosFiltrados.slice(startIndex, startIndex + this.usuariosPorPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.usuariosFiltrados.length / this.usuariosPorPagina);
  }

  mudarPagina(pagina: number): void {
    this.paginaAtual = pagina;
  }

  // Utilitários
  getNomeCompleto(usuario: Usuario): string {
    return `${usuario.firstname} ${usuario.lastname}`;
  }

  getRoleDisplay(role: string): string {
    return role === 'ADMIN' ? 'Administrador' : 'Editor';
  }

  onCancel(): void {
    this.cancelar.emit();
  }

  // Getters para o formulário de edição
  get firstname() { return this.edicaoForm.get('firstname'); }
  get lastname() { return this.edicaoForm.get('lastname'); }
  get role() { return this.edicaoForm.get('role'); }
}