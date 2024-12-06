import { NgModule } from "@angular/core";
import { HomeComponent } from './home/home.component';
import { ComponentsModule } from "../components/components.module";
import { LoginComponent } from './login/login.component';

@NgModule({
  declarations: [
    HomeComponent,
    LoginComponent
  ],
  imports: [
    ComponentsModule
  ],
  exports: [
    HomeComponent,
    LoginComponent
  ],
})

export class PagesModule { }