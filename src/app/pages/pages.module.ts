import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentsModule } from "../components/components.module";
import { AngularMaterialModule } from "../angular-material/angular-material.module";
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { NotFoundComponent } from './not-found/not-found.component';
//import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from "@angular/common";
import { ModeloComponent } from "./modelo/modelo.component";
import { ResultadosComponent } from './resultados/resultados.component';
import { ExplorarComponent } from './explorar/explorar.component';
import { CadastroModeloComponent } from './cadastro-modelo/cadastro-modelo.component';
import { QuillModule } from 'ngx-quill'; 

@NgModule({
  declarations: [
    LoginComponent,
    DashboardComponent,
    NotFoundComponent,
    ModeloComponent,
    ResultadosComponent,
    ExplorarComponent,
    CadastroModeloComponent
  ],
  imports: [
    ComponentsModule,
    AngularMaterialModule,
    BrowserAnimationsModule,
   // BrowserModule,
    CommonModule,
    FormsModule, 
    QuillModule
  ],
  exports: [
    LoginComponent,
    DashboardComponent,
    ModeloComponent,
    ResultadosComponent,
    ExplorarComponent,
    CadastroModeloComponent
  ],
  schemas: [NO_ERRORS_SCHEMA]
})

export class PagesModule { }