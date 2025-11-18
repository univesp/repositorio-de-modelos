import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodePenViewerComponent } from './code-pen-viewer.component';

describe('CodePenViewerComponent', () => {
  let component: CodePenViewerComponent;
  let fixture: ComponentFixture<CodePenViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CodePenViewerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CodePenViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
