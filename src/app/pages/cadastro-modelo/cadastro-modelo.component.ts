import { Component, OnInit, QueryList, ViewChildren, HostListener } from '@angular/core';
import { SelectsList } from '../../data/selects-list';
import { CustomSelectComponent } from '../../components/custom-select/custom-select.component';
import { Selects } from '../../interfaces/selects/selects.interface'; // Importa a interface Selects

@Component({
  selector: 'app-cadastro-modelo',
  templateUrl: './cadastro-modelo.component.html',
  styleUrls: ['./cadastro-modelo.component.scss']
})
export class CadastroModeloComponent implements OnInit {

  // Propriedades para o gerenciamento de tags
  tags: string[] = [];
  currentTagInput: string = '';
  maxTags: number = 7;

  // Propriedades para o carregamento da imagem
  selectedFile: File | null = null;
  imagePreviewUrl: string | ArrayBuffer | null = null; // URL para pré-visualização da imagem/nome do arquivo
  imageErrorMessage: string | null = null;

  // Nova propriedade para o rádio "Código-fonte disponível?"
  // Usamos 'boolean | null' para que possa ser nulo antes de uma seleção,
  // e true/false após a seleção.
  codigoFonteDisponivel: boolean | null = null;

  // Nova propriedade para o rádio "formato"
  // Usamos 'boolean | null' para que possa ser nulo antes de uma seleção,
  // e true/false após a seleção.
  isReaOuJogo: boolean | null = null;

  // Nova estrutura para gerenciar os selects de forma escalável
  public selectsConfig: Selects[] = SelectsList;
  public selectedValues: { [key: string]: string[] } = {};

  @ViewChildren(CustomSelectComponent) customSelects!: QueryList<CustomSelectComponent>;

  constructor() { }

  ngOnInit(): void {
    this.selectsConfig.forEach(config => {
      this.selectedValues[config.key] = [];
    });
  }

  /**
   * HostListener para detectar cliques em todo o documento.
   * Fecha qualquer `app-custom-select` aberto se o clique ocorrer fora dele.
   * Isso é mais robusto agora que temos múltiplos selects.
   * @param event O evento de clique do documento.
   */
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    this.customSelects.forEach(selectComponent => {
      if (selectComponent.isSelectOpen && selectComponent.selectContainerRef && !selectComponent.selectContainerRef.nativeElement.contains(event.target)) {
        selectComponent.isSelectOpen = false;
      }
    });
  }

  /**
   * Manipula a mudança de seleção para QUALQUER select customizado.
   * Esta função genérica é chamada pelo `(selectionChange)` de cada `app-custom-select`.
   * @param key A chave do select (ex: 'curso', 'area').
   * @param selection O array de strings com as opções selecionadas para aquele select.
   */
  onSelectChange(key: string, selection: string[]): void {
    this.selectedValues[key] = selection;
    console.log(`${key} selecionado:`, this.selectedValues[key]);
  }

  /**
   * Manipula a mudança de seleção para os rádio botões "Código-fonte disponível?".
   * Converte o valor da string do input para boolean.
   * @param event O evento de mudança do input de rádio.
   */
  onCodigoFonteChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    // Converte a string "true" ou "false" para o booleano true ou false
    this.codigoFonteDisponivel = (target.value === 'true');

    // Se o usuário selecionou "Não", limpa o arquivo ZIP e mensagens de erro
    if (this.codigoFonteDisponivel === false) {
      this.removeFile(); // Reutiliza a função para limpar o estado do arquivo
    }
  }

  onFormatoChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    // Converte a string "true" ou "false" para o booleano true ou false
    if(target.checked && target.value === 'reaUnivesp') {
      this.isReaOuJogo = true;
    } else if(target.checked && target.value === 'formatoJogo') {
      this.isReaOuJogo = true;
    } else {
      this.isReaOuJogo = false;
    }
    
  }

  // --- Métodos de Tags ---
  /**
   * Normaliza uma string de tag: remove espaços extras, converte para minúsculas,
   * remove acentos e caracteres especiais.
   * @param tag A string da tag a ser normalizada.
   * @returns A tag normalizada.
   */
  private normalizeTag(tag: string): string {
    return tag.trim()
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * Adiciona tags do input de texto ao array `tags`.
   * A função é acionada por eventos de teclado (vírgula, Enter) e pelo evento `blur`.
   * Lida com múltiplos tags separados por vírgula, normalização, duplicatas e o limite máximo.
   * @param event O evento do DOM que disparou a função (opcional, para prevenir o comportamento padrão do Enter).
   */
  addTagFromInput(event?: Event): void {
    if (event && (event as KeyboardEvent).key === 'Enter') {
      event.preventDefault();
    }
    const input = this.currentTagInput.trim();
    if (input) {
      const newTags = input.split(',')
                           .map(tag => this.normalizeTag(tag))
                           .filter(tag => tag !== '' && tag.length >= 2);
      newTags.forEach(tag => {
        if (this.tags.length < this.maxTags && !this.tags.includes(tag)) {
          this.tags.push(tag);
        }
      });
      this.currentTagInput = '';
    }
  }

  /**
   * Remove uma tag específica do array `tags`.
   * @param tagToRemove A tag a ser removida.
   */
  removeTag(tagToRemove: string): void {
    this.tags = this.tags.filter(tag => tag !== tagToRemove);
  }

  // --- Métodos de Imagem/Arquivo (ajustados para a nova lógica) ---
  /**
   * Manipula a seleção de arquivos (tanto imagem quanto .zip).
   * @param event O evento de mudança do input de arquivo.
   */
  onFileSelected(event: Event): void {
    this.selectedFile = null;
    this.imagePreviewUrl = null;
    this.imageErrorMessage = null;

    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const inputId = input.id;

      if (inputId === 'carregaImagem') {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
          this.imageErrorMessage = 'Formato de arquivo inválido. Por favor, selecione uma imagem PNG ou JPG.';
          return;
        }
        const maxSize = 2 * 1024 * 1024;
        if (file.size > maxSize) {
          this.imageErrorMessage = `O arquivo é muito grande. O tamanho máximo permitido para imagem é ${maxSize / (1024 * 1024)} MB.`;
          return;
        }

        this.selectedFile = file;
        const reader = new FileReader();
        reader.onload = () => {
          this.imagePreviewUrl = reader.result;
        };
        reader.onerror = (error) => {
          console.error('Erro ao ler o arquivo:', error);
          this.imageErrorMessage = 'Não foi possível ler o arquivo de imagem.';
        };
        reader.readAsDataURL(file);

      } else if (inputId === 'carregaArquivo') {
        const allowedTypes = ['application/zip'];
        if (!allowedTypes.includes(file.type)) {
          this.imageErrorMessage = 'Formato de arquivo inválido. Por favor, selecione um arquivo .zip.';
          return;
        }
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
          this.imageErrorMessage = `O arquivo é muito grande. O tamanho máximo permitido para .zip é ${maxSize / (1024 * 1024)} MB.`;
          return;
        }
        this.selectedFile = file;
        this.imagePreviewUrl = file.name;
      }

    } else {
      this.imageErrorMessage = 'Nenhum arquivo selecionado.';
    }
  }

  /**
   * Remove o arquivo selecionado (imagem ou .zip).
   */
  removeFile(): void {
    this.selectedFile = null;
    this.imagePreviewUrl = null;
    this.imageErrorMessage = null;
    const fileInputCarregaImagem = document.getElementById('carregaImagem') as HTMLInputElement;
    if (fileInputCarregaImagem) {
      fileInputCarregaImagem.value = '';
    }
    const fileInputCarregaArquivo = document.getElementById('carregaArquivo') as HTMLInputElement;
    if (fileInputCarregaArquivo) {
      fileInputCarregaArquivo.value = '';
    }
  }
}
