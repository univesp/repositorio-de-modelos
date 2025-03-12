import { NgModule } from "@angular/core";
import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SlickCarouselModule } from 'ngx-slick-carousel';
import {MatTabsModule} from '@angular/material/tabs';

@NgModule({
  imports: [
    MatFormFieldModule, 
    MatInputModule, 
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    SlickCarouselModule,
    MatTabsModule
  ],
  exports: [
    MatFormFieldModule, 
    MatInputModule, 
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    SlickCarouselModule,
    MatTabsModule
  ],
})

export class AngularMaterialModule { };