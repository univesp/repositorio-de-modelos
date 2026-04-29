import { NgModule } from '@angular/core';
import { RouterModule, Routes, mapToCanActivate } from '@angular/router';
import { HashLocationStrategy, LocationStrategy } from '@angular/common'; // 👈 ADICIONE ESTA LINHA
import { ResultadosGuard } from './guards/resultados.guard'; 

/* IMPORTANDO NOSSAS PÁGINAS */
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component'; 
import { ModeloComponent } from './pages/modelo/modelo.component';
import { ResultadosComponent } from './pages/resultados/resultados.component';
import { ExplorarComponent } from './pages/explorar/explorar.component';
import { CadastroModeloComponent } from './pages/cadastro-modelo/cadastro-modelo.component'; 
import { PerfilComponent } from './pages/perfil/perfil.component';
import { TagsComponent } from './pages/tags/tags.component';
import { NovaSenhaComponent } from './pages/nova-senha/nova-senha.component';
import { NotFoundComponent } from './pages/not-found/not-found.component'; 

const routes: Routes = [
  {path: '', component: DashboardComponent},
  {path: 'login', component: LoginComponent},
  {path: 'modelo/:id', component: ModeloComponent},
  {path: 'explorar', component: ExplorarComponent},
  {path: 'cadastro-novo-modelo', component: CadastroModeloComponent},
  {path: 'perfil', component: PerfilComponent},
  {path: 'tags', component: TagsComponent},
  {path: 'forms/nova-senha', component: NovaSenhaComponent},

  {
    path: 'resultados', 
    component: ResultadosComponent,
    canActivate: [ResultadosGuard]
  },

  {path: '404', component: NotFoundComponent},
  {path: '**', redirectTo: '/404'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [  // 👈 ADICIONE ESTA PARTE
    { provide: LocationStrategy, useClass: HashLocationStrategy }
  ]
})

export class AppRoutingModule { }