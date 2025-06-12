import { Component, OnInit, QueryList, ViewChildren, HostListener } from '@angular/core';
import { SelectsList } from '../../data/selects-list'; // Importa a lista de configurações de select
import { CustomSelectComponent } from '../../components/custom-select/custom-select.component'; // Importa o CustomSelectComponent
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
  selectedFile: File | null = null; // Armazena o arquivo de imagem selecionado
  imagePreviewUrl: string | ArrayBuffer | null = null; // URL para pré-visualização da imagem
  imageErrorMessage: string | null = null; // Mensagens de erro relacionadas à imagem

  // Nova estrutura para gerenciar os selects de forma escalável
  // Explicitamente tipando selectsConfig como um array de Selects
  public selectsConfig: Selects[] = SelectsList; // <<<< CORREÇÃO AQUI
  // Objeto para armazenar as seleções de CADA select, usando suas 'keys' como chaves
  public selectedValues: { [key: string]: string[] } = {};

  // QueryList para obter todas as instâncias do CustomSelectComponent no template
  @ViewChildren(CustomSelectComponent) customSelects!: QueryList<CustomSelectComponent>;

  constructor() { }

  ngOnInit(): void {
    // Inicializa o objeto selectedValues com arrays vazios para cada chave do SelectsList
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
    // Itera sobre todas as instâncias de CustomSelectComponent
    this.customSelects.forEach(selectComponent => {
      // Verifica se o select está aberto e se o clique não ocorreu dentro do elemento do select
      if (selectComponent.isSelectOpen && selectComponent.selectContainerRef && !selectComponent.selectContainerRef.nativeElement.contains(event.target)) {
        selectComponent.isSelectOpen = false; // Fecha o select
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
              .normalize('NFD') // Normaliza para forma de decomposição (separa a letra do acento)
              .replace(/[\u0300-\u036f]/g, ''); // Remove os diacríticos (acentos)
  }

  /**
   * Adiciona tags do input de texto ao array `tags`.
   * A função é acionada por eventos de teclado (vírgula, Enter) e pelo evento `blur`.
   * Lida com múltiplos tags separados por vírgula, normalização, duplicatas e o limite máximo.
   * @param event O evento do DOM que disparou a função (opcional, para prevenir o comportamento padrão do Enter).
   */
  addTagFromInput(event?: Event): void {
    // Previne o comportamento padrão da tecla Enter (submissão do formulário)
    if (event && (event as KeyboardEvent).key === 'Enter') {
      event.preventDefault();
    }

    // Processa o texto digitado, dividindo por vírgulas e limpando
    const input = this.currentTagInput.trim();
    if (input) {
      const newTags = input.split(',')
                           .map(tag => this.normalizeTag(tag))
                           .filter(tag => tag !== '' && tag.length >= 2); // Filtra tags vazias ou muito curtas

      newTags.forEach(tag => {
        // Adiciona a tag apenas se não for duplicada e o limite não foi atingido
        if (this.tags.length < this.maxTags && !this.tags.includes(tag)) {
          this.tags.push(tag);
        }
      });
      this.currentTagInput = ''; // Limpa o input após adicionar as tags
    }
  }

  /**
   * Remove uma tag específica do array `tags`.
   * @param tagToRemove A tag a ser removida.
   */
  removeTag(tagToRemove: string): void {
    this.tags = this.tags.filter(tag => tag !== tagToRemove);
  }

  // --- Métodos de Imagem ---
  /**
   * Manipula a seleção de arquivos para o campo de imagem.
   * @param event O evento de mudança do input de arquivo.
   */
  onFileSelected(event: Event): void {
    this.selectedFile = null; // Limpa o arquivo anterior
    this.imagePreviewUrl = null; // Limpa a pré-visualização anterior
    this.imageErrorMessage = null; // Limpa qualquer mensagem de erro anterior

    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validação do tipo de arquivo
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        this.imageErrorMessage = 'Formato de arquivo inválido. Por favor, selecione uma imagem PNG ou JPG.';
        return;
      }

      // Validação do tamanho do arquivo (ex: máximo de 2MB)
      const maxSize = 2 * 1024 * 1024; // 2 MB
      if (file.size > maxSize) {
        this.imageErrorMessage = `O arquivo é muito grande. O tamanho máximo permitido é ${maxSize / (1024 * 1024)} MB.`;
        return;
      }

      this.selectedFile = file;

      // Cria URL para pré-visualização da imagem
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviewUrl = reader.result;
      };
      reader.onerror = (error) => {
        console.error('Erro ao ler o arquivo:', error);
        this.imageErrorMessage = 'Não foi possível ler o arquivo de imagem.';
      };
      reader.readAsDataURL(file); // Lê o arquivo como URL de dados (base64)
    } else {
      this.imageErrorMessage = 'Nenhum arquivo selecionado.';
    }
  }

  /**
   * Remove a imagem selecionada e sua pré-visualização.
   */
  removeImage(): void {
    this.selectedFile = null;
    this.imagePreviewUrl = null;
    this.imageErrorMessage = null;
    // Opcional: Limpar o input de arquivo (se for necessário reiniciar a seleção)
    const fileInput = document.getElementById('carregaImagem') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = ''; // Limpa o arquivo selecionado no elemento input
    }
  }
}
