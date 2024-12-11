import { Component, EventEmitter, Output, signal } from '@angular/core';

@Component({
  selector: 'app-login-component',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  hide = signal(true);
  clickEvent(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }

  @Output('onLogin') onLoginEmitt = new EventEmitter<boolean>();

  onLogin() {
    this.onLoginEmitt.emit(true);
  }
}
