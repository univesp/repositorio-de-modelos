import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisualizarUsuariosComponent } from './visualizar-usuarios.component';

describe('VisualizarUsuariosComponent', () => {
  let component: VisualizarUsuariosComponent;
  let fixture: ComponentFixture<VisualizarUsuariosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VisualizarUsuariosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VisualizarUsuariosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
