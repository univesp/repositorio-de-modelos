import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modal-recuperacao-senha',
  templateUrl: './modal-recuperacao-senha.component.html',
  styleUrls: ['./modal-recuperacao-senha.component.scss']
})
export class ModalRecuperacaoSenhaComponent {
  @Output() solicitarReset = new EventEmitter<string>();
  @Output() fecharModal = new EventEmitter<void>();

  formularioReset: FormGroup;
  carregando = false;

  constructor(private fb: FormBuilder) {
    this.formularioReset = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  enviar(): void {
    if (this.formularioReset.valid) {
      this.carregando = true;
      const email = this.formularioReset.get('email')?.value;
      this.solicitarReset.emit(email);
    }
  }

  resetarEstado(): void {
    this.carregando = false;
    this.formularioReset.reset();
  }

  fechar(): void {
    this.fecharModal.emit();
  }
}