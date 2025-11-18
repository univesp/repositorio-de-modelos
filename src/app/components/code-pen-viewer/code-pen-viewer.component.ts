import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-code-pen-viewer',
  templateUrl: './code-pen-viewer.component.html',
  styleUrls: ['./code-pen-viewer.component.scss']
})
export class CodePenViewerComponent implements OnInit, OnDestroy {
  @Input() codepenId!: string;
  @Input() codepenUser!: string;

  embedUrl: SafeResourceUrl | null = null;
  isLoading = true;
  hasError = false;
  errorMessage = '';

  private readonly embedHeight = 400;
  private readonly embedTheme = 'dark';
  private readonly defaultTab = 'result';
  private loadTimeout: any;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.loadCodePenEmbed();
  }

  loadCodePenEmbed(): void {
    if (!this.codepenId || !this.codepenUser) {
      this.handleError('URL do CodePen inválida');
      return;
    }

    // Reset states
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    const embedUrl = `https://codepen.io/${this.codepenUser}/embed/${this.codepenId}?height=${this.embedHeight}&theme-id=${this.embedTheme}&default-tab=${this.defaultTab}`;
    this.embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);

    //TIMEOUT de segurança - se demorar mais de 10 segundos, considera erro
    this.loadTimeout = setTimeout(() => {
      if (this.isLoading) {
        this.handleError('Tempo limite excedido. O CodePen pode estar indisponível.');
      }
    }, 10000);
  }

  onIframeLoad(): void {
    // Limpa o timeout
    if (this.loadTimeout) {
      clearTimeout(this.loadTimeout);
      this.loadTimeout = null;
    }
    
    this.isLoading = false;
  }

  onIframeError(): void {
    // Limpa o timeout
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

  // 👇 NOVO MÉTODO: Tentar carregar em uma nova aba para verificar
  testInNewTab(): void {
    window.open(`https://codepen.io/${this.codepenUser}/pen/${this.codepenId}`, '_blank');
  }

  ngOnDestroy(): void {
    // Cleanup
    if (this.loadTimeout) {
      clearTimeout(this.loadTimeout);
    }
  }
}