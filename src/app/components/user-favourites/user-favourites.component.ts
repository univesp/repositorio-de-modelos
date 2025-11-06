import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Modelo } from '../../interfaces/modelo/modelo.interface';
import { Modeloslist } from '../../data/modelos-list';
import { SalvosService } from '../../services/salvos.service';
import { AuthService } from '../../services/auth.service';

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
  paginaAtual: number = 1;
  modelosPorPagina: number = 5;
  totalPaginas: number = 0;
  paginasParaExibir: number[] = [];

  isLoading = true;

  constructor(
    private router: Router,
    private salvosService: SalvosService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    // Escuta mudanças diretas no serviço de salvos
    this.salvosService.modelosSalvos$.subscribe({
      next: (modelos) => {
        //console.log(' Modelos recebidos do serviço:', modelos.length);
        this.modelosSalvos = modelos;
        this.modelosFiltrados = [...modelos]; // Inicializa os modelos filtrados
        this.aplicarFiltros();                // Aplica filtros iniciais
        this.atualizarPaginacao();
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
    }
  }

  // Métodos de paginação
  private atualizarPaginacao(): void {
    // Calcula total de páginas
    this.totalPaginas = Math.ceil(this.modelosFiltrados.length / this.modelosPorPagina);
    
    // Garante que página atual está dentro dos limites
    if (this.paginaAtual > this.totalPaginas && this.totalPaginas > 0) {
      this.paginaAtual = this.totalPaginas;
    } else if (this.paginaAtual < 1) {
      this.paginaAtual = 1;
    }
    
    // Calcula índices para slice
    const startIndex = (this.paginaAtual - 1) * this.modelosPorPagina;
    const endIndex = startIndex + this.modelosPorPagina;
    
    // Atualiza modelos da página atual
    this.modelosPaginados = this.modelosFiltrados.slice(startIndex, endIndex);
    
    // Atualiza páginas para exibir
    this.atualizarPaginasParaExibir();
  }

  private atualizarPaginasParaExibir(): void {
    const maxPaginasVisiveis = 5;
    let startPage: number;
    let endPage: number;

    if (this.totalPaginas <= maxPaginasVisiveis) {
      startPage = 1;
      endPage = this.totalPaginas;
    } else {
      const maxPagesBeforeCurrent = Math.floor(maxPaginasVisiveis / 2);
      const maxPagesAfterCurrent = Math.ceil(maxPaginasVisiveis / 2) - 1;

      if (this.paginaAtual <= maxPagesBeforeCurrent) {
        startPage = 1;
        endPage = maxPaginasVisiveis;
      } else if (this.paginaAtual + maxPagesAfterCurrent >= this.totalPaginas) {
        startPage = this.totalPaginas - maxPaginasVisiveis + 1;
        endPage = this.totalPaginas;
      } else {
        startPage = this.paginaAtual - maxPagesBeforeCurrent;
        endPage = this.paginaAtual + maxPagesAfterCurrent;
      }
    }

    this.paginasParaExibir = Array.from(
      { length: (endPage - startPage) + 1 },
      (_, i) => startPage + i
    );
  }

  // Métodos de navegação
  irParaPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaAtual = pagina;
      this.atualizarPaginacao();
      this.rolarParaTopo();
    }
  }

  proximaPagina(): void {
    if (this.paginaAtual < this.totalPaginas) {
      this.irParaPagina(this.paginaAtual + 1);
    }
  }

  paginaAnterior(): void {
    if (this.paginaAtual > 1) {
      this.irParaPagina(this.paginaAtual - 1);
    }
  }

  irParaPrimeiraPagina(): void {
    this.irParaPagina(1);
  }

  irParaUltimaPagina(): void {
    this.irParaPagina(this.totalPaginas);
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
      return;
    }

    const todosModelos: Modelo[] = Modeloslist;
    const modelosFiltrados = todosModelos.filter(modelo => 
      idsSalvos.includes(modelo.id)
    );
    
    //console.log(' Modelos carregados:', modelosFiltrados.length);
    this.modelosSalvos = modelosFiltrados;
    this.modelosFiltrados = [...modelosFiltrados];
    this.aplicarFiltros(); // Aplica ordenação inicial
    this.isLoading = false;
  }

  // Aplica filtros e ordenação
  aplicarFiltros(): void {
    //console.log(' Aplicando filtros...');
    //console.log(' Filtro texto:', this.filtroTexto);
    //console.log(' Ordenação:', this.ordenacaoSelecionada);
   // console.log(' Modelos antes do filtro:', this.modelosSalvos.length);

    let modelosFiltrados = [...this.modelosSalvos];

    // 1. Aplica filtro de texto (busca por título)
    if (this.filtroTexto.trim()) {
        const termo = this.filtroTexto.toLowerCase().trim();
        //console.log(' Buscando por:', termo);

        modelosFiltrados = modelosFiltrados.filter(modelo => {
          const inclui = modelo.titulo.toLowerCase().includes(termo);
          //console.log(`   ${modelo.titulo} -> ${inclui ? 'INCLUÍDO' : 'FILTRADO'}`);
          return inclui;
        });
    }

    //console.log(' Modelos após filtro de texto:', modelosFiltrados.length);

    // 2. Aplica ordenação
    modelosFiltrados = this.aplicarOrdenacao(modelosFiltrados);

    //console.log(' Modelos finais:', modelosFiltrados.length);
    //console.log(' Primeiros títulos:', modelosFiltrados.slice(0, 3).map(m => m.titulo));

    this.modelosFiltrados = modelosFiltrados;

    // Reseta para primeira página e atualiza paginação
    this.paginaAtual = 1;
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
}