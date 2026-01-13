import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ModeloAPI } from '../../interfaces/modelo/modelo-api.interface';
import { ModeloCadastroRequest } from '../../interfaces/modelo/modelo-create-request.interface';
import { SelectsList } from '../../data/selects-list';
import { Selects } from '../../interfaces/selects/selects.interface';

@Component({
  selector: 'app-editar-modelo-modal',
  templateUrl: './editar-modelo-modal.component.html',
  styleUrls: ['./editar-modelo-modal.component.scss']
})
export class EditarModeloModalComponent implements OnInit, OnChanges {
  @Input() modelo!: ModeloAPI;
  @Input() isOpen: boolean = false;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<ModeloCadastroRequest>();

  // Campos editáveis
  titulo: string = '';
  descricao: string = '';
  link: string = '';
  formato: string = '';
  
  // Arrays
  tags: string[] = [];
  curso: string[] = [];
  area: string[] = [];
  tipo: string[] = [];
  tecnologias: string[] = [];
  acessibilidade: string[] = [];
  licenca: string[] = [];
  
  // Booleanos
  hasCodigo: boolean = false;
  hasEquipe: boolean = false;
  
  // Links
  codigoLink: string = '';
  
  // Equipe
  equipeDocente: string = '';
  equipeCoordenacao: string = '';
  equipeRoteirizacao: string = '';
  equipeLayout: string = '';
  equipeIlustracao: string = '';
  equipeProgramacao: string = '';
  
  // Tags
  currentTagInput: string = '';
  maxTags: number = 5;
  
  // Configuração dos selects
  selectsConfig: Selects[] = SelectsList;
  selectedValues: { [key: string]: string[] } = {};
  
  // Loading
  isLoading: boolean = false;

  ngOnInit(): void {
    this.carregarDadosModelo();
  }

  // método para detectar mudanças no isOpen
  ngOnChanges(changes: SimpleChanges): void {
    // Quando o modal é aberto (isOpen muda de false para true)
    if (changes['isOpen'] && changes['isOpen'].currentValue === true) {
      // RESETAR o estado de loading quando o modal for aberto
      this.isLoading = false;
      
      // Recarregar os dados do modelo (importante para pegar as atualizações)
      if (this.modelo) {
        this.carregarDadosModelo();
      }
    }

    // Quando o modelo é atualizado
    if (changes['modelo'] && changes['modelo'].currentValue) {
      this.carregarDadosModelo();
    }
  }

  private carregarDadosModelo(): void {
    if (!this.modelo) return;

    // Resetar o estado do loading
    this.isLoading = false;

    // Campos básicos
    this.titulo = this.modelo.titulo;
    this.descricao = this.modelo.descricao;
    this.link = this.modelo.link;
    this.formato = this.modelo.formato;
    
    // Arrays
    this.tags = [...this.modelo.tags];
    this.curso = [...(this.modelo.curso || [])];
    this.area = [...(this.modelo.area || [])];
    this.tipo = [...(this.modelo.tipo || [])];
    this.tecnologias = [...(this.modelo.tecnologias || [])];
    this.acessibilidade = [...(this.modelo.acessibilidade || [])];
    this.licenca = [...(this.modelo.licenca || [])];
    
    // Booleanos
    this.hasCodigo = this.modelo.hasCodigo;
    this.hasEquipe = this.modelo.hasEquipe;
    
    // Links
    this.codigoLink = this.modelo.codigoLink || '';
    
    // Equipe
    if (this.modelo.equipe) {
      this.equipeDocente = this.modelo.equipe.docente || '';
      this.equipeCoordenacao = this.modelo.equipe.coordenacao || '';
      this.equipeRoteirizacao = this.modelo.equipe.roteirizacao || '';
      this.equipeLayout = this.modelo.equipe.layout || '';
      this.equipeIlustracao = this.modelo.equipe.ilustracao || '';
      this.equipeProgramacao = this.modelo.equipe.programacao || '';
    }
    
    // Inicializa selects
    this.selectedValues = {
      'curso': this.curso,
      'area': this.area,
      'tipo': this.tipo,
      'tecnologias': this.tecnologias,
      'acessibilidade': this.acessibilidade,
      'licenca': this.licenca
    };
  }

  // Métodos simples de tags
  addTag(): void {
    const tag = this.currentTagInput.trim();
    if (tag && this.tags.length < this.maxTags && !this.tags.includes(tag)) {
      this.tags.push(tag);
      this.currentTagInput = '';
    }
  }

  removeTag(tag: string): void {
    this.tags = this.tags.filter(t => t !== tag);
  }

  onTagKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addTag();
    }
  }

  // Manipuladores de selects
  onSelectChange(key: string, selection: string[]): void {
    this.selectedValues[key] = selection;
    
    // Atualiza as propriedades correspondentes
    switch(key) {
      case 'curso': this.curso = selection; break;
      case 'area': this.area = selection; break;
      case 'tipo': this.tipo = selection; break;
      case 'tecnologias': this.tecnologias = selection; break;
      case 'acessibilidade': this.acessibilidade = selection; break;
      case 'licenca': this.licenca = selection; break;
    }
  }

  // Métodos do modal
  close(): void {
    this.isLoading = false;
    this.isOpen = false;
    this.closed.emit();
  }

  save(): void {
    this.isLoading = true;
    
    // Montar os dados para envio
    const dadosEditados: ModeloCadastroRequest = {
      ano: this.modelo.ano,
      mes: this.modelo.mes,
      dia: this.modelo.dia,
      date: this.modelo.date,
      formato: this.formato,
      titulo: this.titulo,
      descricao: this.descricao,
      link: this.link,
      tags: this.tags,
      curso: this.curso,
      area: this.area,
      tipo: this.tipo,
      tecnologias: this.tecnologias,
      acessibilidade: this.acessibilidade,
      licenca: this.licenca,
      hasCodigo: this.hasCodigo,
      codigoLink: this.codigoLink || undefined,
      autoria: this.modelo.autoria,
      hasEquipe: this.hasEquipe,
      equipe: this.hasEquipe ? {
        docente: this.equipeDocente,
        coordenacao: this.equipeCoordenacao,
        roteirizacao: this.equipeRoteirizacao,
        layout: this.equipeLayout,
        ilustracao: this.equipeIlustracao,
        programacao: this.equipeProgramacao
      } : undefined,
      carousel: this.modelo.carousel,
      destaque: this.modelo.destaque
    };
    
    // Emitir os dados, não um evento DOM
    this.saved.emit(dadosEditados);
  }
}