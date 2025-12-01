import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Modelo } from '../../interfaces/modelo/modelo.interface';
import { BookmarkService } from '../../services/bookmark.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-destaques',
  templateUrl: './destaques.component.html',
  styleUrls: ['./destaques.component.scss']
})
export class DestaquesComponent implements OnInit, OnDestroy {

  @Input({ required: true }) modelosList: Modelo[] = [];
  isLoggedIn: boolean = false;

  private authSubscription!: Subscription;
  private userProfileSubscription!: Subscription;

  constructor(
    private router: Router,
    private bookmarkService: BookmarkService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.isLoggedIn = this.authService.isSignedIn();

    // Escuta mudanças de autenticação
    this.authService.isAuthenticated().subscribe(loggedIn => {
      this.isLoggedIn = loggedIn;
    });

    // Sincroniza os bookmarks com o perfil do usuário
    this.userProfileSubscription = this.authService.userProfile$.subscribe(profile => {
      if (profile && this.modelosList) {
        this.sincronizarBookmarks(profile.salvos || []);
      }
    });

    // Sincroniza inicialmente
    this.sincronizarBookmarksInicial();
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.userProfileSubscription) {
      this.userProfileSubscription.unsubscribe();
    }
  }

  private sincronizarBookmarks(idsSalvos: string[]): void {
    this.modelosList.forEach(modelo => {
      modelo.isSalvo = idsSalvos.includes(modelo.id);
    });
  }

  private sincronizarBookmarksInicial(): void {
    const currentProfile = this.authService.getCurrentUserProfile();
    if (currentProfile && currentProfile.salvos) {
      this.sincronizarBookmarks(currentProfile.salvos);
    }
  }

  redirectModeloPage(id: string) {
    this.router.navigate([`modelo/${id}`]);
  }

  toggleBookmark(modelo: any, event: Event) {
    event.stopPropagation();
    this.bookmarkService.toggle(modelo.id);
  }

  get modelosDestaque(): Modelo[] {
    return this.modelosList.filter(modelo => modelo.isDestaque);
  }
}