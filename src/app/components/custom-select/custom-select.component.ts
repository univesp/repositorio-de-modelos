import { Component, OnInit, Input, Output, EventEmitter, HostListener, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-custom-select',
  templateUrl: './custom-select.component.html',
  styleUrls: ['./custom-select.component.scss']
})
export class CustomSelectComponent implements OnInit {

  // ENTRADAS (INPUTS)
  @Input() label: string = ''; // Rótulo do select (ex: "Curso", "Área")
  @Input() options: string[] = []; // Array de opções para o select
  @Input() placeholder: string = '[ Selecione ]'; // Texto de placeholder
  @Input() initialSelection: string[] = []; // Seleções iniciais, se houver
  @Input() allowMultiple: boolean = true; // Define se permite múltiplas seleções
  @Input() required: boolean = false; // Indica se o select é obrigatório

  // SAÍDAS (OUTPUTS)
  @Output() selectionChange = new EventEmitter<string[]>(); // Emite as opções selecionadas

  // PROPRIEDADES INTERNAS
  isSelectOpen: boolean = false; // Controla a visibilidade do painel de opções
  selectedItems: string[] = []; // Itens selecionados internamente

  // Referência ao elemento HTML do select customizado
  @ViewChild('selectContainer') selectContainerRef!: ElementRef;

  constructor(private elementRef: ElementRef) { }

  ngOnInit(): void {
    // Inicializa os itens selecionados com base na entrada (initialSelection)
    if (this.initialSelection) {
      this.selectedItems = [...this.initialSelection];
    }
  }

  /**
   * HostListener para detectar cliques em todo o documento.
   * Fecha o select se o clique ocorrer fora do componente do select.
   * @param event O evento de clique do documento.
   */
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    // Verifica se o clique não ocorreu dentro do elemento do select customizado
    if (this.isSelectOpen && this.selectContainerRef && !this.selectContainerRef.nativeElement.contains(event.target)) {
      this.isSelectOpen = false; // Fecha o select
    }
  }

  /**
   * Alterna a visibilidade do painel de opções do select.
   * @param event O evento de clique, para parar a propagação e evitar que o HostListener o capture imediatamente.
   */
  toggleSelect(event: MouseEvent): void {
    event.stopPropagation(); // Impede que o clique se propague para o documento e feche o select imediatamente
    this.isSelectOpen = !this.isSelectOpen;
  }

  /**
   * Manipula a mudança de seleção de uma opção.
   * Adiciona ou remove a opção do array `selectedItems`.
   * @param option A opção que foi alterada.
   * @param event O evento de mudança do checkbox/radio.
   */
  onOptionChange(option: string, event: Event): void {
    event.stopPropagation(); // Impede o fechamento do select ao clicar no checkbox/radio

    const target = event.target as HTMLInputElement;
    const isChecked = target.checked;

    if (this.allowMultiple) { // Lógica para múltiplas seleções (checkbox)
      if (isChecked) {
        if (!this.selectedItems.includes(option)) {
          this.selectedItems.push(option);
        }
      } else {
        this.selectedItems = this.selectedItems.filter(item => item !== option);
      }
    } else { // Lógica para seleção única (radio - não é o caso atual, mas para escalabilidade futura)
      this.selectedItems = isChecked ? [option] : [];
      this.isSelectOpen = false; // Fecha o select após seleção única
    }
    this.selectionChange.emit(this.selectedItems); // Emite a mudança
  }

  /**
   * Verifica se uma opção está selecionada.
   * @param option A opção a ser verificada.
   * @returns `true` se a opção estiver selecionada, `false` caso contrário.
   */
  isSelected(option: string): boolean {
    return this.selectedItems.includes(option);
  }

  /**
   * Retorna o valor a ser exibido no select quando fechado.
   * Se houver opções selecionadas, retorna uma string formatada.
   * Se não houver, retorna um placeholder.
   */
  getDisplayValue(): string {
    if (this.selectedItems.length === 0) {
      return this.placeholder;
    } else {
      return this.selectedItems.join(', ');
    }
  }

  /**
   * Gera um ID seguro para elementos HTML a partir de uma string de opção.
   * Remove espaços e caracteres não-alfanuméricos, substituindo-os por hifens.
   * @param option A string da opção.
   * @returns Um ID/nome seguro para uso em HTML.
   */
  getSafeHtmlId(option: string): string {
    return option.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '');
  }
}
