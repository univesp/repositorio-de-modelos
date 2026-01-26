import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalRecuperacaoSenhaComponent } from './modal-recuperacao-senha.component';

describe('ModalRecuperacaoSenhaComponent', () => {
  let component: ModalRecuperacaoSenhaComponent;
  let fixture: ComponentFixture<ModalRecuperacaoSenhaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModalRecuperacaoSenhaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalRecuperacaoSenhaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
