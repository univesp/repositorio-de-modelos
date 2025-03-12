import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

/* IMPORTANDO NOSSAS PÁGINAS */
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component'; 
import { ExplorarComponent } from './pages/explorar/explorar.component';
import { ModeloComponent } from './pages/modelo/modelo.component';
import { NotFoundComponent } from './pages/not-found/not-found.component'; 

const routes: Routes = [
  {path: '', component: HomeComponent},
  {path: 'login', component: LoginComponent},
  {path: 'dashboard', component: DashboardComponent},
  {path: 'explorar', component: ExplorarComponent},
  {path: 'modelo/:id', component: ModeloComponent},
  {path: '404', component: NotFoundComponent},
  {path: '**', redirectTo: '/404'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule { }
