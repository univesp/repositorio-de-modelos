import { NgModule } from "@angular/core";
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SlickCarouselModule } from 'ngx-slick-carousel';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';

@NgModule({
  imports: [
    MatFormFieldModule, 
    MatInputModule, 
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    SlickCarouselModule,
    MatTabsModule,
    MatMenuModule
  ],
  exports: [
    MatFormFieldModule, 
    MatInputModule, 
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    SlickCarouselModule,
    MatTabsModule,
    MatMenuModule
  ],
})

export class AngularMaterialModule { };