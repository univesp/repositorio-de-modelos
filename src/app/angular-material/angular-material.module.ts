import { NgModule } from "@angular/core";
import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';


@NgModule({
  imports: [
    MatFormFieldModule, 
    MatInputModule, 
    MatSelectModule,
    MatIconModule
  ],
  exports: [
    MatFormFieldModule, 
    MatInputModule, 
    MatSelectModule,
    MatIconModule
  ],
})

export class AngularMaterialModule { };