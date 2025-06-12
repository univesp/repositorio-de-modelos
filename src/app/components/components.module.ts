import { NgModule } from "@angular/core";
import { FormsModule } from '@angular/forms';

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
import { TagsDashboardComponent } from './tags-dashboard/tags-dashboard.component';
import { DestaquesComponent } from './destaques/destaques.component';
import { ExplorarGridComponent } from "./explorar-grid/explorar-grid.component";
import { ExplorarListComponent } from "./explorar-list/explorar-list.component";
import { CustomSelectComponent } from './custom-select/custom-select.component';

@NgModule({
  declarations: [
    HeaderComponent,
    FooterComponent,
    LoginComponent,
    FilterComponent,
    CarouselComponent,
    NovidadesComponent,
    TagsDashboardComponent,
    DestaquesComponent,
    ExplorarGridComponent,
    ExplorarListComponent,
    CustomSelectComponent,
  ],
  imports: [
    CommonModule,
    PipesModule,
    AngularMaterialModule,
    BrowserAnimationsModule,
    FormsModule
  ],
  exports: [
    HeaderComponent,
    FooterComponent,
    LoginComponent,
    FilterComponent,
    CarouselComponent,
    NovidadesComponent,
    TagsDashboardComponent,
    DestaquesComponent,
    ExplorarGridComponent,
    ExplorarListComponent,
    CustomSelectComponent,
  ]
})
export class ComponentsModule { }