import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

// DATA
import { Modeloslist } from '../../data/modelos-list';

// INTERFACES
import { Modelo } from '../../interfaces/modelo/modelo.interface';
import { ModeloAPI } from '../../interfaces/modelo/modelo-api.interface';

// SERVICES
import { ModoExplorarService } from '../../services/modo-explorar.service';
import { BookmarkService } from '../../services/bookmark.service';
import { ApiModelosService } from '../../services/api-modelos.service';

// UTILS
import { ImagemDefaultUtils } from '../../utils/imagem-default.utils';

@Component({
  selector: 'app-explorar',
  templateUrl: './explorar.component.html',
  styleUrls: ['./explorar.component.scss']
})
export class ExplorarComponent implements OnInit, OnDestroy {

  modelosExibidos: Modelo[] = [];
  modelosOriginais: Modelo[] = []; // Armazena os modelos sem ordenação
  viewType: 'grid' | 'list' = 'grid';
  opacityClicked = 1;
  ordenacaoSelecionada: string = '';

  paginaAtual: number = 1;
  totalPaginas: number = 1;

  isLoading: boolean = true;
  usandoAPI: boolean = false;

  constructor(
    private router: Router,
    private modoExplorarService: ModoExplorarService,
    private bookmarkService: BookmarkService,
    private apiModelosService: ApiModelosService
  ) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    this.modoExplorarService.resetAll();

    // Verificar tamanho da tela primeiro
    this.checkScreenSize();

    // Só usar localStorage se for tela grande
    if (window.innerWidth >= 992) {
      const savedViewType = localStorage.getItem('viewType');
      this.viewType = savedViewType === 'list' ? 'list' : 'grid';
    } else {
      // Forçar list em telas menores
      this.viewType = 'list';
    }

    // CARREGA MODELOS - TENTA API PRIMEIRO, SE FALHAR USA LOCAIS
    this.carregarModelosComFallback();

    // Adicionar listener para mudanças de tamanho
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  /**
   * Tenta carregar da API, se falhar usa dados locais
   */
  private carregarModelosComFallback(): void {
    this.isLoading = true;
    this.usandoAPI = true; // Tenta usar API
    
    this.apiModelosService.getModelosDaAPI().subscribe({
      next: (modelosAPI: ModeloAPI[]) => {
        if (modelosAPI.length > 0) {
          //console.log(`Carregados ${modelosAPI.length} modelos da API`);
          // CONVERTE API -> Modelo
          const modelosConvertidos = this.converterAPIparaModelo(modelosAPI);
          this.processarModelos(modelosConvertidos);
        } else {
          // API retornou vazio ou erro, usa dados locais
          console.log('⚠️ API vazia ou com erro, usando dados locais');
          this.usandoAPI = false;
          this.carregarModelosLocais();
        }
      },
      error: (error) => {
        // Erro na requisição, usa dados locais
        console.error('❌ Erro na requisição API, usando dados locais:', error);
        this.usandoAPI = false;
        this.carregarModelosLocais();
      }
    });
  }

  /**
   * Carrega dados locais
   */
  private carregarModelosLocais(): void {
    const modelosComBookmark = Modeloslist.map(modelo => ({
      ...modelo,
      isSalvo: this.bookmarkService.isSalvo(modelo.id)
    })) as Modelo[];

    this.processarModelos(modelosComBookmark);
  }

   /**
   * Processa os modelos (aplica ordenação, etc)
   */
   private processarModelos(modelos: Modelo[]): void {
    // Salva os modelos originais
    this.modelosOriginais = [...modelos];
    
    let modelosOrdenados = [...modelos];
    
    if (this.ordenacaoSelecionada) {
      modelosOrdenados = this.aplicarOrdenacaoInterna(modelosOrdenados);
    }

    this.modelosExibidos = modelosOrdenados;
    this.isLoading = false;
    
    //console.log(`Exibindo ${this.modelosExibidos.length} modelos (${this.usandoAPI ? 'API' : 'LOCAL'})`);
  }

  /**
   * Converte ModeloAPI[] para Modelo[]
   */
  private converterAPIparaModelo(apiModelos: ModeloAPI[]): Modelo[] {
    return apiModelos.map(apiModelo => {
      // Formata data
      const formatarData = (dataISO: string): string => {
        try {
          const date = new Date(dataISO);
          // Compensa o fuso horário
          const dateCorrigido = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
          
          return dateCorrigido.toLocaleDateString('pt-BR', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          });
        } catch {
          return 'Data não disponível';
        }
      };

      // Limpa HTML
      const limparHTML = (html: string): string => {
        if (!html) return '';
        const texto = html.replace(/<[^>]*>/g, '');
        return texto.length > 200 ? texto.substring(0, 200) + '...' : texto;
      };

      // USA O UTILITÁRIO DE IMAGENS DEFAULT
      const imagemParaExibir = ImagemDefaultUtils.getImagemParaExibicao(apiModelo);

      return {
        id: apiModelo.id,
        titulo: apiModelo.titulo,
        recurso: apiModelo.formato,
        date: formatarData(apiModelo.date),
        curso: apiModelo.curso || [],
        disciplina: apiModelo.curso?.[0] || 'Disciplina não especificada',
        area: apiModelo.area || [],
        categorias: apiModelo.tipo || [],
        tipo: apiModelo.tipo || [],
        img_sm: imagemParaExibir,
        img_md: imagemParaExibir,
        img_lg: imagemParaExibir,
        descricao: limparHTML(apiModelo.descricao),
        autor: apiModelo.autoria || apiModelo.createdBy || 'Autor não informado',
        formato: apiModelo.formato,
        tecnologia: apiModelo.tecnologias || [],
        acessibilidade: apiModelo.acessibilidade || [],
        hasMobile: false,
        hasCodigo: apiModelo.hasCodigo || false,
        isDestaque: apiModelo.destaque || false,
        hasEquipe: apiModelo.hasEquipe || false,
        equipe: apiModelo.equipe ? {
          docente: apiModelo.equipe.docente || '',
          coordenacao: apiModelo.equipe.coordenacao || '',
          roteirizacao: apiModelo.equipe.roteirizacao || '',
          ilustracao: apiModelo.equipe.ilustracao || '',
          layout: apiModelo.equipe.layout || '',
          programacao: apiModelo.equipe.programacao || ''
        } : undefined,
        tags: apiModelo.tags || [],
        link: apiModelo.link || '',
        github: apiModelo.codigoLink || undefined,
        isSalvo: this.bookmarkService.isSalvo(apiModelo.id),
        licenca: apiModelo.licenca?.join(', ') || 'Não especificada',
        carousel: apiModelo.carousel
      };
    });
  }

  /**
   * Aplica a ordenação quando o select é alterado
   */
  aplicarOrdenacao(): void {
    if (!this.modelosOriginais.length) return;
    
    // Aplica a ordenação nos modelos originais
    const modelosOrdenados = this.aplicarOrdenacaoInterna([...this.modelosOriginais]);
    this.modelosExibidos = modelosOrdenados;
  }

  /**
   * Aplica a lógica de ordenação interna
   */
  private aplicarOrdenacaoInterna(modelos: Modelo[]): Modelo[] {
    if (!modelos.length || !this.ordenacaoSelecionada) return [...modelos];
    
    const modelosCopia = [...modelos];
    
    switch (this.ordenacaoSelecionada) {
      case 'alfabetica':
        return modelosCopia.sort((a, b) => 
          a.titulo.localeCompare(b.titulo, 'pt-BR', { sensitivity: 'base' })
        );
      
      case 'recentes':
        // Ordena do MAIS RECENTE para o MAIS ANTIGO
        return modelosCopia.sort((a, b) => {
          const dataA = this.converterStringParaDate(a.date);
          const dataB = this.converterStringParaDate(b.date);
          
          // Mais recente primeiro (data B - data A)
          return dataB.getTime() - dataA.getTime();
        });
      
      case 'antigos':
        // Ordena do MAIS ANTIGO para o MAIS RECENTE
        return modelosCopia.sort((a, b) => {
          const dataA = this.converterStringParaDate(a.date);
          const dataB = this.converterStringParaDate(b.date);
          
          // Mais antigo primeiro (data A - data B)
          return dataA.getTime() - dataB.getTime();
        });
      
      default:
        return modelosCopia;
    }
  }

  /**
   * Converte string de data para objeto Date - CORRIGIDO PARA FUSO HORÁRIO
  */
  private converterStringParaDate(dataStr: string): Date {
    if (!dataStr || dataStr === 'Data não disponível') {
      return new Date(0);
    }
    
    try {
      // Se a data já estiver no formato ISO (vindo da API)
      if (dataStr.includes('T') && dataStr.includes('-')) {
        // Para datas ISO, já corrige o fuso
        const date = new Date(dataStr);
        // Compensa o fuso horário para mostrar a data correta
        return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
      }
      
      // Regex melhorada (lida com ponto ou não)
      const dataLimpa = dataStr.toLowerCase().replace(/\./g, '');
      const match = dataLimpa.match(/(\d+)\s+de\s+(\w+)\s+de\s+(\d+)/i);
      
      if (match) {
        const dia = parseInt(match[1], 10);
        const mesStr = match[2].toLowerCase().substring(0, 3);
        const ano = parseInt(match[3], 10);
        
        // Mapeia meses abreviados
        const meses: {[key: string]: number} = {
          'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
          'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
        };
        
        const mes = meses[mesStr] || 0;
        
        
        return new Date(ano, mes, dia, 12, 0, 0);
      }
      
      // Tenta parsear de outras formas
      const date = new Date(dataStr);
      return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
      
    } catch (e) {
      console.warn('Erro ao converter data:', dataStr);
      return new Date(0);
    }
  }

  /**
   * Verifica o tamanho da tela e ajusta a visualização
   */
  checkScreenSize(): void {
    if (window.innerWidth < 992) {
      // Forçar visualização List em telas menores
      this.viewType = 'list';
    } else {
      // Em telas grandes, manter a preferência do usuário
      const savedViewType = localStorage.getItem('viewType');
      this.viewType = savedViewType === 'list' ? 'list' : 'grid';
    }
  }

  /**
   * Alterna o tipo de visualização entre 'grid' e 'list'
   */
  switchViewType(type: 'grid' | 'list') {
    this.viewType = type;
    localStorage.setItem('viewType', type);
  }

  /**
   * Navega para a página de detalhes de um modelo específico.
   */
  abrirModelo(id: string) {
    const idNumber = Number(id);
    this.modoExplorarService.setModeloId(idNumber);
    this.router.navigate(['/modelo', id]);
  }

  /**
   * Método para receber as informações de paginação do grid
   */
  onPaginacaoAtualizada(info: { paginaAtual: number; totalPaginas: number }) {
    this.paginaAtual = info.paginaAtual;
    this.totalPaginas = info.totalPaginas;
  }

   /**
   * Recebe o estado de carregamento do grid
   */
   onCarregamentoAtualizado(carregando: boolean) {
    this.isLoading = carregando;
  }

  ngOnDestroy(): void {
    this.modoExplorarService.setModoExplorarAtivo(false);
    this.modoExplorarService.setModeloId(null);
    this.modoExplorarService.setFiltrosAtuais({});
    window.removeEventListener('resize', () => this.checkScreenSize());
  }
}