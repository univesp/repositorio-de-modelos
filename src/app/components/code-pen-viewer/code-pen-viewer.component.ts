import { Component, Input, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-code-pen-viewer',
  templateUrl: './code-pen-viewer.component.html',
  styleUrls: ['./code-pen-viewer.component.scss']
})
export class CodePenViewerComponent implements OnInit, OnDestroy {
  @Input() codepenId!: string;
  @Input() codepenUser!: string;
  @ViewChild('viewerContainer') viewerContainer!: ElementRef;

  embedUrl: SafeResourceUrl | null = null;
  isLoading = true;
  hasError = false;
  errorMessage = '';
  isFullscreen = false;

  private readonly embedHeight = 400;
  private readonly embedTheme = 'dark';
  private readonly defaultTab = 'result';
  private loadTimeout: any;

  constructor(
    private sanitizer: DomSanitizer,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.loadCodePenEmbed();
  }

  // ESC apenas para fechar o modo de tela cheia (opcional)
  @HostListener('document:keydown.escape')
  handleEscapeKey() {
    if (this.isFullscreen) {
      this.exitFullscreen();
    }
  }

  loadCodePenEmbed(): void {
    if (!this.codepenId || !this.codepenUser) {
      this.handleError('URL do CodePen inválida');
      return;
    }

    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    const embedUrl = `https://codepen.io/${this.codepenUser}/embed/${this.codepenId}?height=${this.embedHeight}&theme-id=${this.embedTheme}&default-tab=${this.defaultTab}`;
    this.embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);

    this.loadTimeout = setTimeout(() => {
      if (this.isLoading) {
        this.handleError('Tempo limite excedido. O CodePen pode estar indisponível.');
      }
    }, 10000);
  }

  onIframeLoad(): void {
    if (this.loadTimeout) {
      clearTimeout(this.loadTimeout);
      this.loadTimeout = null;
    }
    this.isLoading = false;
  }

  onIframeError(): void {
    if (this.loadTimeout) {
      clearTimeout(this.loadTimeout);
      this.loadTimeout = null;
    }
    this.handleError('Erro ao carregar o CodePen. Verifique se a URL está correta e se o CodePen está disponível.');
  }

  private handleError(message: string): void {
    this.isLoading = false;
    this.hasError = true;
    this.errorMessage = message;
    this.embedUrl = null;
  }

  openInCodePen(): void {
    window.open(`https://codepen.io/${this.codepenUser}/pen/${this.codepenId}`, '_blank');
  }

  testInNewTab(): void {
    window.open(`https://codepen.io/${this.codepenUser}/pen/${this.codepenId}`, '_blank');
  }

  toggleFullscreen(): void {
    if (this.isFullscreen) {
      this.exitFullscreen();
    } else {
      this.enterFullscreen();
    }
  }

  enterFullscreen(): void {
    this.isFullscreen = true;
    // Apenas bloqueia o scroll do body, sem API nativa
    this.renderer.setStyle(document.body, 'overflow', 'hidden');
  }

  exitFullscreen(): void {
    this.isFullscreen = false;
    // Restaura o scroll do body
    this.renderer.removeStyle(document.body, 'overflow');
  }

  ngOnDestroy(): void {
    if (this.loadTimeout) {
      clearTimeout(this.loadTimeout);
    }
    if (this.isFullscreen) {
      this.exitFullscreen();
    }
  }
}