import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarModeloModalComponent } from './editar-modelo-modal.component';

describe('EditarModeloModalComponent', () => {
  let component: EditarModeloModalComponent;
  let fixture: ComponentFixture<EditarModeloModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditarModeloModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarModeloModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
