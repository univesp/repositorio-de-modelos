import { NgModule } from "@angular/core";

import { CommonModule } from "@angular/common";

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { PipesModule } from "../pipes/pipes.module";
import { AngularMaterialModule } from "../angular-material/angular-material.module";
import { LoginComponent } from './login/login.component';
import { FilterComponent } from './filter/filter.component';
import { CarouselComponent } from "./carousel/carousel.component";
import { NovidadesComponent } from './novidades/novidades.component';

@NgModule({
  declarations: [
    HeaderComponent,
    FooterComponent,
    LoginComponent,
    FilterComponent,
    CarouselComponent,
    NovidadesComponent
  ],
  imports: [
    CommonModule,
    PipesModule,
    AngularMaterialModule,
    BrowserAnimationsModule
  ],
  exports: [
    HeaderComponent,
    FooterComponent,
    LoginComponent,
    FilterComponent,
    CarouselComponent,
    NovidadesComponent
  ]
})
export class ComponentsModule { }