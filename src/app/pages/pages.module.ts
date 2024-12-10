import { NgModule } from "@angular/core";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HomeComponent } from './home/home.component';
import { ComponentsModule } from "../components/components.module";
import { AngularMaterialModule } from "../angular-material/angular-material.module";

@NgModule({
  declarations: [
    HomeComponent,
  ],
  imports: [
    ComponentsModule,
    AngularMaterialModule,
    BrowserAnimationsModule
  ],
  exports: [
    HomeComponent,
  ],
})

export class PagesModule { }