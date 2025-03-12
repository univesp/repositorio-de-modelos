import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HomeComponent } from './home/home.component';
import { ComponentsModule } from "../components/components.module";
import { AngularMaterialModule } from "../angular-material/angular-material.module";
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from "@angular/common";
import { ExplorarComponent } from './explorar/explorar.component';
import { ModeloComponent } from "./modelo/modelo.component";

@NgModule({
  declarations: [
    HomeComponent,
    LoginComponent,
    DashboardComponent,
    NotFoundComponent,
    ExplorarComponent,
    ModeloComponent
  ],
  imports: [
    ComponentsModule,
    AngularMaterialModule,
    BrowserAnimationsModule,
    BrowserModule,
    CommonModule
  ],
  exports: [
    HomeComponent,
    LoginComponent,
    DashboardComponent,
    ExplorarComponent,
    ModeloComponent
  ],
  schemas: [NO_ERRORS_SCHEMA]
})

export class PagesModule { }