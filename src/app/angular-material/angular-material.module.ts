import { NgModule } from "@angular/core";
import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';


@NgModule({
  imports: [
    MatFormFieldModule, 
    MatInputModule, 
    MatSelectModule,
    MatIconModule,
    MatButtonModule
  ],
  exports: [
    MatFormFieldModule, 
    MatInputModule, 
    MatSelectModule,
    MatIconModule,
    MatButtonModule
  ],
})

export class AngularMaterialModule { };