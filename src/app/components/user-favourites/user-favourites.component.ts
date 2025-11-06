import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Modelo } from '../../interfaces/modelo/modelo.interface';
import { Modeloslist } from '../../data/modelos-list';
import { SalvosService } from '../../services/salvos.service';
import { AuthService } from '../../services/auth.service';
import { PaginationService, PaginationConfig } from '../../services/pagination.service';

@Component({
  selector: 'app-user-favourites',
  templateUrl: './user-favourites.component.html',
  styleUrl: './user-favourites.component.scss'
})
export class UserFavouritesComponent implements OnInit {
  // Arrays de dados
  modelosSalvos: Modelo[] = [];
  modelosFiltrados: Modelo[] = [];
  modelosPaginados: Modelo[] = [];

  // Filtros
  filtroTexto: string = '';
  ordenacaoSelecionada: string = ''; // Default

  //Propriedades de paginação
  paginationConfig!: PaginationConfig;

  isLoading = true;

  constructor(
    private router: Router,
    private salvosService: SalvosService,
    public authService: AuthService,
    private paginationService: PaginationService
  ) {}

  ngOnInit(): void {
    // Inicializa a configuração de paginação
    this.paginationConfig = this.paginationService.inicializarPaginacao([], 5);

    // Escuta mudanças diretas no serviço de salvos
    this.salvosService.modelosSalvos$.subscribe({
      next: (modelos) => {
        //console.log(' Modelos recebidos do serviço:', modelos.length);
        this.modelosSalvos = modelos;
        this.modelosFiltrados = [...modelos]; // Inicializa os modelos filtrados
        this.aplicarFiltros();                // Aplica filtros iniciais
        this.isLoading = false;
      },
      error: (error) => {
        //console.error('Erro ao carregar modelos salvos:', error);
        this.isLoading = false;
      }
    });

    // Força o carregamento inicial baseado no perfil atual
    const currentProfile = this.authService.getCurrentUserProfile();
    if (currentProfile && currentProfile.salvos) {
      this.carregarModelosSalvos(currentProfile.salvos);
    } else {
      this.modelosSalvos = [];
      this.modelosFiltrados = [];
      this.isLoading = false;
      // Atualiza a paginação mesmo com array vazio
      this.atualizarPaginacao();
    }
  }

  // Métodos de paginação
  private atualizarPaginacao(): void {
    this.paginationConfig = this.paginationService.atualizarPaginacaoComNovosItens(
      this.modelosFiltrados, 
      this.paginationConfig
    );
    this.modelosPaginados = this.paginationService.obterItensPaginados(
      this.modelosFiltrados, 
      this.paginationConfig
    );
  }

  // Métodos de navegação
  irParaPagina(pagina: number): void {
    this.paginationConfig = this.paginationService.irParaPagina(pagina, this.paginationConfig);
    this.atualizarModelosPaginados();
    this.rolarParaTopo();
  }

  proximaPagina(): void {
    this.paginationConfig = this.paginationService.proximaPagina(this.paginationConfig);
    this.atualizarModelosPaginados();
    this.rolarParaTopo();
  }

  paginaAnterior(): void {
    this.paginationConfig = this.paginationService.paginaAnterior(this.paginationConfig);
    this.atualizarModelosPaginados();
    this.rolarParaTopo();
  }

  irParaPrimeiraPagina(): void {
    this.paginationConfig = this.paginationService.irParaPrimeiraPagina(this.paginationConfig);
    this.atualizarModelosPaginados();
    this.rolarParaTopo();
  }
  

  irParaUltimaPagina(): void {
    this.paginationConfig = this.paginationService.irParaUltimaPagina(this.paginationConfig);
    this.atualizarModelosPaginados();
    this.rolarParaTopo();
  }


  private atualizarModelosPaginados(): void {
    this.modelosPaginados = this.paginationService.obterItensPaginados(
      this.modelosFiltrados, 
      this.paginationConfig
    );
  }

  private rolarParaTopo(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Carrega os modelos completos baseado nos IDs salvos
  private carregarModelosSalvos(idsSalvos: string[]): void {
    if (idsSalvos.length === 0) {
      this.modelosSalvos = [];
      this.modelosFiltrados = [];
      this.isLoading = false;
      // CORREÇÃO: Atualiza a paginação
      this.atualizarPaginacao();
      return;
    }
  
    const todosModelos: Modelo[] = Modeloslist;
    const modelosFiltrados = todosModelos.filter(modelo => 
      idsSalvos.includes(modelo.id)
    );
    
    this.modelosSalvos = modelosFiltrados;
    this.modelosFiltrados = [...modelosFiltrados];
    this.aplicarFiltros();
    this.isLoading = false;
  }

  // Aplica filtros e ordenação
  aplicarFiltros(): void {
    let modelosFiltrados = [...this.modelosSalvos];
  
    if (this.filtroTexto.trim()) {
      const termo = this.filtroTexto.toLowerCase().trim();
      modelosFiltrados = modelosFiltrados.filter(modelo => 
        modelo.titulo.toLowerCase().includes(termo)
      );
    }
  
    modelosFiltrados = this.aplicarOrdenacao(modelosFiltrados);
    this.modelosFiltrados = modelosFiltrados;
  
    // CORREÇÃO: Em vez de this.paginaAtual = 1, atualizamos a configuração
    this.paginationConfig = this.paginationService.irParaPagina(1, this.paginationConfig);
    this.atualizarPaginacao();
  }

  // Aplica a ordenação selecionada
  private aplicarOrdenacao(modelos: Modelo[]): Modelo[] {
    const userProfile = this.authService.getCurrentUserProfile();
    const salvosIds = userProfile?.salvos || [];
  
    //console.log('Aplicando ordenação:', this.ordenacaoSelecionada);
    //console.log(' IDs salvos:', salvosIds);

    // Se não há ordenação selecionada, usa "salvos-recentes" como default
    const ordenacao = this.ordenacaoSelecionada || 'salvos-recentes';
  
    // Cria uma cópia do array para não modificar o original
    const modelosOrdenados = [...modelos];
  
    switch (ordenacao) {
      case '':
      case 'salvos-recentes':
        // Ordem inversa do array de salvos (último salvo primeiro)
        return modelosOrdenados.sort((a, b) => {
          const indexA = salvosIds.indexOf(a.id);
          const indexB = salvosIds.indexOf(b.id);
          
          //console.log(`   Ordenando: ${a.titulo} (index: ${indexA}) vs ${b.titulo} (index: ${indexB})`);
          
          // Se não encontrou no array, vai para o final
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          
          // Ordem decrescente (mais recentes primeiro) - índice maior = mais recente
          return indexB - indexA;
        });
  
      case 'salvos-antigos':
        // Ordem normal do array de salvos (primeiro salvo primeiro)
        return modelosOrdenados.sort((a, b) => {
          const indexA = salvosIds.indexOf(a.id);
          const indexB = salvosIds.indexOf(b.id);
          
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          
          // Ordem crescente (mais antigos primeiro)
          return indexA - indexB;
        });
  
      case 'alfabetica':
        return modelosOrdenados.sort((a, b) => {
          const resultado = a.titulo.localeCompare(b.titulo, 'pt-BR', { sensitivity: 'base' });
          //console.log(`   Alfabético: ${a.titulo} vs ${b.titulo} -> ${resultado}`);
          return resultado;
        });
  
      case 'mais-recentes':
        return modelosOrdenados.sort((a, b) => {
          const dateA = this.converterDataParaTimestamp(a.date);
          const dateB = this.converterDataParaTimestamp(b.date);
          
          //console.log(`   Data: ${a.titulo} (${a.date} -> ${dateA}) vs ${b.titulo} (${b.date} -> ${dateB})`);
          
          // Se datas iguais, ordena alfabeticamente
          if (dateB === dateA) {
            return a.titulo.localeCompare(b.titulo, 'pt-BR', { sensitivity: 'base' });
          }
          
          return dateB - dateA; // Mais recentes primeiro
        });
  
      case 'mais-antigos':
        return modelosOrdenados.sort((a, b) => {
          const dateA = this.converterDataParaTimestamp(a.date);
          const dateB = this.converterDataParaTimestamp(b.date);
          
          // Se datas iguais, ordena alfabeticamente
          if (dateA === dateB) {
            return a.titulo.localeCompare(b.titulo, 'pt-BR', { sensitivity: 'base' });
          }
          
          return dateA - dateB; // Mais antigos primeiro
        });
  
      default:
        return modelosOrdenados;
    }
  }

  // Converte string de data para timestamp
  private converterDataParaTimestamp(dateString: string): number {
    // Assumindo que date está no formato "DD/MM/YYYY" ou "MM/YYYY" ou "YYYY"
    const parts = dateString.split('/');
    
    if (parts.length === 3) {
      // DD/MM/YYYY
      const [day, month, year] = parts;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).getTime();
    } else if (parts.length === 2) {
      // MM/YYYY
      const [month, year] = parts;
      return new Date(parseInt(year), parseInt(month) - 1, 1).getTime();
    } else if (parts.length === 1) {
      // YYYY
      return new Date(parseInt(parts[0]), 0, 1).getTime();
    }
    
    // Fallback: retorna 0 se não conseguir converter
    return 0;
  }


  // Navega para a página do modelo
  verMaisInformacoes(modeloId: string): void {
    this.router.navigate(['/modelo', modeloId]);
  }

  // Abre o link do material em nova aba
  irParaMaterial(link: string | undefined): void {
    if (link) {
      window.open(link, '_blank');
    }
  }

  // Remove um modelo dos salvos
  removerDosSalvos(modeloId: string, event: Event): void {
    event.stopPropagation(); // Previne que o clique afete o card
    
    this.salvosService.removerDosSalvos(modeloId).subscribe({
      next: () => {
        //console.log('Modelo removido dos salvos');
      },
      error: (error) => {
        //console.error('Erro ao remover dos salvos:', error);
      }
    });
  }

  // MÉTODOS GETTER PARA O TEMPLATE (importante!)
  get paginaAtual(): number {
    return this.paginationConfig.paginaAtual;
  }

  get totalPaginas(): number {
    return this.paginationConfig.totalPaginas;
  }

  get paginasParaExibir(): number[] {
    return this.paginationConfig.paginasParaExibir;
  }
}