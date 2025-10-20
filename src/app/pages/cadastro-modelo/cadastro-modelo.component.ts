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
  selectedImageFile: File | null = null;
  imagePreviewUrl: string | ArrayBuffer | null = null; // URL para pré-visualização da imagem/nome do arquivo
  imageErrorMessage: string | null = null;

  // Propriedades para o carregamento do arquivo ZIP
  selectedZipFile: File | null = null;
  zipFileName: string | null = null;
  zipErrorMessage: string | null = null;

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

    // Propriedade para o conteúdo do Quill Editor
  // Esta será a string HTML retornada pelo editor
  descricaoModelo: string = ''; // Nova propriedade para vincular ao editor

  // Configuração da barra de ferramentas do Quill Editor
  toolbarOptions = [
    ['bold', 'italic', 'underline', 'strike'],        // negrito, itálico, sublinhado, tachado
    ['blockquote', 'code-block'],                     // citação, bloco de código

    [{ 'header': 1 }, { 'header': 2 }],               // títulos personalizados
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],     // listas ordenadas/não ordenadas
    [{ 'script': 'sub'}, { 'script': 'super' }],      // subscrito/sobrescrito
    [{ 'indent': '-1'}, { 'indent': '+1' }],          // identação
    [{ 'direction': 'rtl' }],                         // direção do texto

    [{ 'size': ['small', false, 'large', 'huge'] }],  // tamanhos de fonte personalizados
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],        // cabeçalhos

    [{ 'color': [] }, { 'background': [] }],          // cores de texto e fundo
    [{ 'font': [] }],                                 // fontes
    [{ 'align': [] }],                                // alinhamento

    ['clean'],                                        // remover formatação
    ['link']                        // link, imagem, vídeo (se você quiser)
  ];


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
    //console.log(`${key} selecionado:`, this.selectedValues[key]);
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
      this.removeFile('zip'); // Reutiliza a função para limpar o estado do arquivo
    }
  }

  onFormatoChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    // Converte a string "true" ou "false" para o booleano true ou false
    if(target.checked && target.id === 'reaUnivesp') {
      this.isReaOuJogo = true;
    } else if(target.checked && target.id === 'formatoJogo') {
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
    if (event && (event as KeyboardEvent).key === ',') {
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

  onKeyUp(event: KeyboardEvent): void {
    const tecla = event.key;
    if(tecla === ','){
      event.preventDefault();
      this.addTagFromInput();
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
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.imageErrorMessage = 'Nenhum arquivo selecionado.';
      return;
    }
  
    const file = input.files[0];
    const inputId = input.id;
  
    if (inputId === 'carregaImagem') {
      // Reset imagem
      this.selectedImageFile = null;
      this.imagePreviewUrl = null;
      this.imageErrorMessage = null;
  
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      const maxSize = 2 * 1024 * 1024; // 2MB
  
      if (!allowedTypes.includes(file.type)) {
        this.imageErrorMessage = 'Formato inválido. Selecione PNG ou JPG.';
        return;
      }
  
      if (file.size > maxSize) {
        this.imageErrorMessage = `Imagem muito grande. Máximo: ${maxSize / (1024 * 1024)} MB.`;
        return;
      }
  
      this.selectedImageFile = file;
  
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviewUrl = reader.result as string;
      };
      reader.onerror = () => {
        this.imageErrorMessage = 'Erro ao ler o arquivo de imagem.';
      };
      reader.readAsDataURL(file);
  
    } else if (inputId === 'carregaArquivo') {
      // Reset zip
      this.selectedZipFile = null;
      this.zipFileName = null;
      this.zipErrorMessage = null;
  
      const allowedTypes = ['application/zip'];
      const maxSize = 10 * 1024 * 1024; // 10MB
  
      if (!allowedTypes.includes(file.type)) {
        this.zipErrorMessage = 'Formato inválido. Envie um arquivo .zip.';
        return;
      }
  
      if (file.size > maxSize) {
        this.zipErrorMessage = `Arquivo .zip muito grande. Máximo: ${maxSize / (1024 * 1024)} MB.`;
        return;
      }
  
      this.selectedZipFile = file;
      this.zipFileName = file.name;
    }
  }

  /**
   * Remove o arquivo selecionado (imagem ou .zip).
   */
  removeFile(type: 'imagem' | 'zip'): void {
    if (type === 'imagem') {
      this.selectedImageFile = null;
      this.imagePreviewUrl = null;
      this.imageErrorMessage = null;
  
      const imageInput = document.getElementById('carregaImagem') as HTMLInputElement;
      if (imageInput) imageInput.value = '';
    } else if (type === 'zip') {
      this.selectedZipFile = null;
      this.zipFileName = null;
      this.zipErrorMessage = null;
  
      const zipInput = document.getElementById('carregaArquivo') as HTMLInputElement;
      if (zipInput) zipInput.value = '';
    }
  }
  

  getCheckedInputsByClass(className: string): { value: string, checked: boolean }[] {
    const inputs: NodeListOf<HTMLInputElement> = document.querySelectorAll(`.${className}`);
    const checkedStatus: { value: string, checked: boolean }[] = [];

    inputs.forEach(input => {
      // Verifica se o input é um checkbox ou radio, e se tem a propriedade 'checked'
      if (input.type === 'checkbox' || input.type === 'radio') {
        checkedStatus.push({
          value: input.value,
          checked: input.checked
        });
      }
    });
    return checkedStatus;
  }

  formatoValue: string = '';

  getInputValue(selector: string): string | null {
    const input = document.querySelector(selector) as HTMLInputElement | null;
    return input?.value.trim() || null;
  }

  onSubmit(): void {
    const formatoSelecionado = this.getCheckedInputsByClass('checkFormato');
    const titleModelo = (document.querySelector('#inputTitle') as HTMLInputElement ).value;
    const urlInput = (document.querySelector('#urlInput') as HTMLInputElement ).value;
    const codigoLink = this.getInputValue('#codigoLink')
    const autoria = (document.querySelector('#autoriaName') as HTMLInputElement ).value;
    const equipeDocenteResponsavel = this.getInputValue('#EquipeDocenteResponsavel');
    const equipeCoordenacao = this.getInputValue('#EquipeCoordenacao');
    const equipeRoteirizacaoDI = this.getInputValue('#equipeRoteirizacaoDI');
    const equipeLayout = this.getInputValue('#equipeLayout');
    const equipeIlustracao = this.getInputValue('#equipeIlustracao');
    const equipeProgramacao = this.getInputValue('#equipeProgramacao');

    
    formatoSelecionado.forEach(e => {
      if(e.checked) {
        //console.log(e.value)
        this.formatoValue = e.value
      }
    })

    // Expressão regular para validar se começa com http:// ou https://
    const regex = /^https?:\/\/.+$/;
    const isValidUrl = regex.test(urlInput);

    if (!isValidUrl) {
      console.warn('URL inválida! Ela deve começar com http:// ou https://');
      return;
    }

    //gerando Id Unico
    const idUnico = Math.floor(100000 + Math.random() * 900000).toString();

    //Pegando a data atual no momento do Submit
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = (hoje.getMonth() + 1).toString().padStart(2, '0'); //Tem sempre 2 digitos
    const dia = hoje.getDate().toString().padStart(2, '0'); // Tem sempre 2 digitos

    //Criando a string de date    
    const mesesAbreviados = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const mesAbreviado = mesesAbreviados[hoje.getMonth()];
    const diaFormatado = String(hoje.getDate()).padStart(2, '0');

    const date = `${mesAbreviado} ${diaFormatado}, ${ano}`;


    const modelo = {
      id: idUnico,
      ano: ano,
      mes: mes,
      dia: dia,
      date: date,
      formato: this.formatoValue,
      titulo: titleModelo,
      descricao: this.descricaoModelo,
      link: urlInput,
      tags: this.tags,
      imagem: this.selectedImageFile,
      curso: this.selectedValues['curso'],
      area: this.selectedValues['area'],
      tipo: this.selectedValues['tipo'],
      tecnologias: this.selectedValues['tecnologias'],
      acessibilidade: this.selectedValues['acessibilidade'],
      licenca: this.selectedValues['licenca'],
      hasCodigo: this.codigoFonteDisponivel,
      codigoZip: this.selectedZipFile,
      codigoLink: codigoLink,
      autoria: autoria,
      hasEquipe: this.isReaOuJogo,
      equipe: {
        docente: equipeDocenteResponsavel,
        coordenacao: equipeCoordenacao,
        roteirizacao: equipeRoteirizacaoDI,
        layout: equipeLayout,
        ilustracao: equipeIlustracao,
        programacao: equipeProgramacao
      }
    };

    console.log('Modelo enviado', modelo)
  }
}
