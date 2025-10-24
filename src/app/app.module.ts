import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PagesModule } from './pages/pages.module';
import { ComponentsModule } from './components/components.module';
import { authFunctionalInterceptor } from './interceptors/auth.functional.interceptor';

import { QuillModule } from 'ngx-quill';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    PagesModule,
    ComponentsModule,
    AppRoutingModule,
    FormsModule,
    QuillModule.forRoot(),
    BrowserAnimationsModule
  ],
  providers: [
    provideHttpClient(withInterceptors([authFunctionalInterceptor])),
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
