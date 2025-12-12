import { Component, OnInit, QueryList, ViewChildren, HostListener } from '@angular/core';
import { SelectsList } from '../../data/selects-list';
import { CustomSelectComponent } from '../../components/custom-select/custom-select.component';
import { Selects } from '../../interfaces/selects/selects.interface'; // Importa a interface Selects
import { ModeloService } from '../../services/modelo.service';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cadastro-modelo',
  templateUrl: './cadastro-modelo.component.html',
  styleUrls: ['./cadastro-modelo.component.scss']
})
export class CadastroModeloComponent implements OnInit {

  // Propriedades para o gerenciamento de tags
  tags: string[] = [];
  currentTagInput: string = '';
  maxTags: number = 5;

  // Propriedades para os radio buttons
  // Usamos 'boolean | null' para que possa ser nulo antes de uma seleção,
  // e true/false após a seleção.
  codigoFonteDisponivel: boolean | null = null;
  mostrarEquipe: boolean = false;
  formatoSelecionado: string = '';

  // Estrutura para gerenciar os selects de forma escalável
  public selectsConfig: Selects[] = SelectsList;
  public selectedValues: { [key: string]: string[] } = {};

    // Propriedade para o conteúdo do Quill Editor
  // Esta será a string HTML retornada pelo editor
  descricaoModelo: string = ''; // Propriedade para vincular ao editor

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

  // Propriedades para loading e usuário
  isLoading: boolean = false;
  currentUser: any = null;

  // Propriedade para controle visual de erros
  camposComErro: string[] = [];
  selectsComErro: string[] = [];


  @ViewChildren(CustomSelectComponent) customSelects!: QueryList<CustomSelectComponent>;

  constructor(
    private modeloService: ModeloService,
    private authService: AuthService,
  ) { }

  ngOnInit(): void {
    this.selectsConfig.forEach(config => {
      this.selectedValues[config.key] = [];
    });

     // Obtém o usuário logado
     this.currentUser = this.authService.getCurrentUserProfile();
     if (!this.currentUser) {
       // Se não tiver o perfil carregado, tenta carregar
       this.authService.getUserProfile().subscribe();
       this.authService.userProfile$.subscribe(profile => {
         this.currentUser = profile;
       });
     }
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

    // LIMPA O ERRO DESTE SELECT QUANDO HOUVER SELEÇÃO
    this.limparErroSelect(key);
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
  }

  onFormatoChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.formatoSelecionado = target.value;

    // Mostrar equipe para: REA Univesp, Jogo OU Novotec
    this.mostrarEquipe = ['REA Univesp', 'Jogo', 'Novotec'].includes(this.formatoSelecionado);    
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
 * Adiciona tag quando pressionar Enter
 */
  onTagEnterKey(event: any): void {
    event.preventDefault();
    event.stopPropagation();
    
    const input = this.currentTagInput.trim();
    if (input) {
      const normalizedTag = this.normalizeTag(input);
      if (this.tags.length < this.maxTags && !this.tags.includes(normalizedTag) && normalizedTag.length >= 2) {
        this.tags.push(normalizedTag);
        this.currentTagInput = '';
      }
    }
  }

  /**
   * Remove uma tag específica do array `tags`.
   * @param tagToRemove A tag a ser removida.
   */
  removeTag(tagToRemove: string): void {
    this.tags = this.tags.filter(tag => tag !== tagToRemove);
  }

  // --- Métodos Auxiliares ---

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

  getInputValue(selector: string): string | null {
    const input = document.querySelector(selector) as HTMLInputElement | null;
    return input?.value.trim() || null;
  }


  // --- Métodos Principais ---

  private validarFormulario(): boolean {
    // Reseta todos os erros
    this.camposComErro = [];
    this.selectsComErro = [];
  
    const erros: string[] = [];
  
    // Validação do formato
    if (!this.getFormatoSelecionado()) {
      erros.push('formato');
    }
  
    // Validação do título
    if (!this.getInputValue('#inputTitle')) {
      erros.push('inputTitle');
    }
  
    // Validação da descrição
    if (!this.descricaoModelo || this.descricaoModelo.trim() === '') {
      erros.push('descricao');
    }
  
    // Validação das tags
    if (this.tags.length === 0) {
      erros.push('tags');
    }
  
    // Validação da URL
    const urlInput = this.getInputValue('#urlInput');
    if (!urlInput) {
      erros.push('urlInput');
    } else if (!this.validaUrl(urlInput)) {
      erros.push('urlInput');
    }
  
    // Validação do código-fonte
    if (this.codigoFonteDisponivel === null) {
      erros.push('codigoFonte');
    }
  
    // Validação dos selects obrigatórios
    const selectsComErro = this.validarSelectsObrigatorios();
    
    // Se há erros, mostra o primeiro e marca todos visualmente
    if (erros.length > 0 || selectsComErro.length > 0) {
      this.camposComErro = erros;
      this.selectsComErro = selectsComErro;
      
      const primeiroErro = erros[0] || selectsComErro[0];
      this.mostrarErroValidacao(primeiroErro, erros, selectsComErro);
      return false;
    }
  
    return true;
  }

  private validaUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private getFormatoSelecionado(): string {
    return this.formatoSelecionado || '';
  }

  /**
   * Valida os selects customizados que são obrigatórios
   */
  private validarSelectsObrigatorios(): string[] {
    const selectsComErro: string[] = [];
    const selectsObrigatorios = this.selectsConfig.filter(select => select.obrigatorio);
    
    for (const select of selectsObrigatorios) {
      const valoresSelecionados = this.selectedValues[select.key];
      
      if (!valoresSelecionados || valoresSelecionados.length === 0) {
        selectsComErro.push(select.key);
      }
    }
    
    return selectsComErro;
  }

  /**
 * Mostra o erro de validação e marca todos os campos com problema
 */
  private mostrarErroValidacao(primeiroErro: string, errosCampos: string[], errosSelects: string[]): void {
    const totalErros = errosCampos.length + errosSelects.length;
    
    // 1° Apenas marca os campos com erro visualmente (sem scroll)
    this.camposComErro = errosCampos;
    this.selectsComErro = errosSelects;
    
    // 2° Mostra alerta
    Swal.fire({
      icon: 'warning',
      title: 'Campos obrigatórios',
      text: `Preencha ${totalErros} campo(s) obrigatório(s) destacado(s) em vermelho`,
      confirmButtonColor: '#7155d8',
    }).then(() => {
      // 3° Só depois scrolla para o primeiro erro
      setTimeout(() => {
        this.scrollParaPrimeiroErro(primeiroErro);
      }, 100);
    });
  }

  // Obtém o nome do usuário logado para o campo "Autoria"
  private getAutoria(): string {
    if (this.currentUser) {
      // Tenta o nome complet, se disponível
      if (this.currentUser.nome) {
        return this.currentUser.nome;
      }
      // Se NÃO tiver nome, usa firstname + lastname
      if (this.currentUser.firstname && this.currentUser.lastname) {
        return `${this.currentUser.firstname} ${this.currentUser.lastname}`;
      }
      // Se não tiver NADA usa o Email
      return this.currentUser.email || 'Autor Desconhecido';
    }
    return 'Autor Desconhecido';
  }

  /**
   * Scrolla para o primeiro select obrigatório com erro
   */
  private scrollParaPrimeiroSelectObrigatorio(): void {
    setTimeout(() => {
      const primeiroSelectObrigatorio = document.querySelector('app-custom-select');
      if (primeiroSelectObrigatorio) {
        primeiroSelectObrigatorio.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 100);
  }

  private scrollParaPrimeiroErro(primeiroErro: string): void {
    setTimeout(() => {
      const elemento = this.obterElementoPorErro(primeiroErro);
      
      if (elemento) {
        elemento.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        this.adicionarDestaqueVisual(elemento);
      }
    }, 100);
  }
  
  /**
   * Obtém o elemento HTML correspondente ao tipo de erro
   */
  private obterElementoPorErro(erro: string): HTMLElement | null {
    if (erro.startsWith('select-')) {
      return document.querySelector('app-custom-select') as HTMLElement;
    }
  
    const elementosMap: { [key: string]: string } = {
      'formato': 'cadastro-modelo__formato-container',
      'inputTitle': 'inputTitle',
      'descricao': 'quill-editor-container',
      'tags': 'tags-input-container',
      'urlInput': 'urlInput',
      'codigoFonte': 'formato-radio-inline-container',
      'codigoLink': 'codigoLink'
    };
  
    const elementoId = elementosMap[erro];
    if (!elementoId) return null;
  
    return document.getElementById(elementoId) || 
           document.querySelector(`.${elementoId}`) as HTMLElement;
  }
  
  /**
   * Adiciona destaque visual temporário ao elemento
   */
  private adicionarDestaqueVisual(elemento: HTMLElement): void {
    elemento.style.transition = 'all 0.3s ease';
    elemento.style.boxShadow = '0 0 0 3px rgba(113, 85, 216, 0.3)';
    
    setTimeout(() => {
      elemento.style.boxShadow = '';
    }, 1000);
  }

  /**
   * Scrolla para um elemento específico
   */
  private scrollParaElemento(elementId: string): void {
    setTimeout(() => {
      const elemento = document.getElementById(elementId) || 
                      document.querySelector(`.${elementId}`);
      if (elemento) {
        elemento.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 100);
  }

  limparFormulario(mostrarMensagem: boolean = true): void {
    this.camposComErro = [];
    this.selectsComErro = [];

    // Limpa todos os campos
    this.tags = [];
    this.currentTagInput = '';
    this.descricaoModelo = '';
    this.codigoFonteDisponivel = null;
    this.mostrarEquipe = false;
     this.formatoSelecionado = ''; 
    
    // Reseta os arrays Selects
    this.selectsConfig.forEach(config => {
      this.selectedValues[config.key] = [];
    });

    // Limpa inputs de texto
    const inputs = document.querySelectorAll('.input-text');
    inputs.forEach((input: any) => input.value = '');

    // Limpa radios
    const radios = document.querySelectorAll('input[type="radio"]');
    radios.forEach((radio: any) => radio.checked = false);

    if(mostrarMensagem) {
      Swal.fire({
        icon: 'info',
        title: 'Formulário limpo',
        text: 'Todos os campos foram resetados',
        confirmButtonColor: '#7155d8',
        timer: 2000,
        showConfirmButton: false
      });
    }
  }

  /**
 * Limpa o erro visual de um campo específico quando o usuário começa a interagir
 */
  limparErroCampo(campo: string): void {
    this.camposComErro = this.camposComErro.filter(c => c !== campo);
  }

  /**
   * Limpa o erro visual de um select quando o usuário seleciona uma opção
   */
  limparErroSelect(selectKey: string): void {
    this.selectsComErro = this.selectsComErro.filter(s => s !== selectKey);
  }

  /**
   * Limpa erro do formato quando um radio é selecionado
   */
  limparErroFormato(): void {
    this.camposComErro = this.camposComErro.filter(c => c !== 'formato');
  }

  /**
   * Limpa erro do código-fonte quando um radio é selecionado  
   */
  limparErroCodigoFonte(): void {
    this.camposComErro = this.camposComErro.filter(c => c !== 'codigoFonte');
  }

  /**
 * Scrolla para o topo do formulário (div .cadastro-modelo__container)
 */
  private scrollParaTopoFormulario(): void {
    const container = document.querySelector('.cadastro-modelo__container');
    if (container) {
      container.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' // 'start' vai alinhar ao topo da viewport
      });
    }
  }

  /**
 * Método com o código ORIGINAL do submit (sem verificação de título)
 */
  private executarSubmitOriginal(): void {
    this.isLoading = true;

    // Obtém os valores dos campos
    const formatoSelecionado = this.getFormatoSelecionado();
    const titleModelo = this.getInputValue('#inputTitle');
    const urlInput = this.getInputValue('#urlInput');
    const codigoLink = this.getInputValue('#codigoLink');

    // Obtém dados da equipe APENAS se for REA da Univesp
    let equipeData = undefined;
    if (this.mostrarEquipe) {
      equipeData = {
        docente: this.getInputValue('#EquipeDocenteResponsavel') || '',
        coordenacao: this.getInputValue('#EquipeCoordenacao') || '',
        roteirizacao: this.getInputValue('#equipeRoteirizacaoDI') || '',
        layout: this.getInputValue('#equipeLayout') || '',
        ilustracao: this.getInputValue('#equipeIlustracao') || '',
        programacao: this.getInputValue('#equipeProgramacao') || ''
      };
    }

    // Pegando a data atual no momento do Submit
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth() + 1;
    const dia = hoje.getDate();
    const date = `${ano}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;

    // CORREÇÃO: Converte null para undefined no codigoLink
    const codigoLinkFinal = codigoLink ? codigoLink : undefined;

    // Monta objeto no formato da API
    const modeloRequest = {
      ano: ano,
      mes: mes,
      dia: dia,
      date: date,
      formato: formatoSelecionado,
      titulo: titleModelo!,
      descricao: this.descricaoModelo,
      link: urlInput!,
      tags: this.tags,
      curso: this.selectedValues['curso'],
      area: this.selectedValues['area'],
      tipo: this.selectedValues['tipo'],
      tecnologias: this.selectedValues['tecnologias'],
      acessibilidade: this.selectedValues['acessibilidade'],
      licenca: this.selectedValues['licenca'],
      hasCodigo: this.codigoFonteDisponivel || false,
      codigoLink: codigoLinkFinal,
      autoria: this.getAutoria(),
      hasEquipe: this.mostrarEquipe || false,
      equipe: equipeData
    };

    console.log('Modelo enviado:', modeloRequest);
    console.log('Usuário logado:', this.currentUser);

    // Envia para o banco de dados via API
    this.modeloService.criarModelo(modeloRequest).subscribe({
      next: (response) => {
        this.isLoading = false;
        Swal.fire({
          icon: 'success',
          title: 'Sucesso!',
          text: 'Modelo cadastrado com sucesso!',
          confirmButtonColor: '#7155d8',
          timer: 3000,
          showConfirmButton: true
        }).then(() => {
          // 1. Limpa o formulário sem mostrar mensagem
          this.limparFormulario(false);

          // 2. Aguarda um pouco e faz scroll para o topo
          setTimeout(() => {
            this.scrollParaTopoFormulario();
          }, 100);
        });
        
        console.log('Modelo criado:', response);
      },
      error: (error) => {
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Erro!',
          text: 'Erro ao cadastrar modelo. Tente novamente.',
          confirmButtonColor: '#7155d8'
        });
        console.error('Erro ao criar modelo:', error);
      }
    });
  }


  onSubmit(): void {
    if (this.isLoading) return;
  
    if (!this.validarFormulario()) {
      return;
    }
  
    // Verificação de usuário logado
    if (!this.currentUser) {
      Swal.fire({
        icon: 'error',
        title: 'Erro!',
        text: 'Erro: Usuário não identificado. Faça login novamente.',
        confirmButtonColor: '#7155d8'
      });
      return;
    }
  
    // Obtém o título do modelo
    const titleModelo = this.getInputValue('#inputTitle');
  
    // VERIFICAÇÃO DO TÍTULO DUPLICADO
    this.verificarTituloDuplicado(titleModelo!).subscribe({
      next: (tituloExiste: boolean) => {
        if (tituloExiste) {
          // Título já existe, mostra erro e PARA AQUI
          this.mostrarErroTituloDuplicado(titleModelo!);
          return;
        } else {
          // Título não existe, executa o submit original
          this.executarSubmitOriginal();
        }
      },
      error: (error: any) => {
        console.error('Erro ao verificar título:', error);
        // Se der erro, permite enviar (melhor permitir que bloquear)
        this.executarSubmitOriginal();
      }
    });
  }
  
  /**
 * Verifica se o título já existe no banco
 */
  private verificarTituloDuplicado(titulo: string): Observable<boolean> {
    return this.modeloService.verificarTituloExistente(titulo);
  }

  /**
 * Mostra erro quando título já existe
 */
  private mostrarErroTituloDuplicado(titulo: string): void {
    // Marca o campo de título como erro
    if (!this.camposComErro.includes('inputTitle')) {
      this.camposComErro.push('inputTitle');
    }
    
    // Foca no campo de título
    setTimeout(() => {
      const inputElement = document.getElementById('inputTitle') as HTMLInputElement;
      if (inputElement) {
        inputElement.focus();
        inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
    
    // Mostra SweetAlert
    Swal.fire({
      icon: 'warning',
      title: 'Título já existe',
      html: `Já existe um modelo cadastrado com o título: <strong>"${titulo}"</strong><br><br>
            Por favor, escolha um título diferente.`,
      confirmButtonColor: '#7155d8',
      confirmButtonText: 'Entendi'
    });
  }
}
