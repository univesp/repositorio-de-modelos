import { ModeloAPI } from '../interfaces/modelo/modelo-api.interface';

export class ImagemDefaultUtils {
  private static IMAGENS_DEFAULT = [
    'https://assets.univesp.br/repositorio-de-modelos/card-lg1.png',
    'https://assets.univesp.br/repositorio-de-modelos/card-lg2.png',
    'https://assets.univesp.br/repositorio-de-modelos/card-lg3.png',
    'https://assets.univesp.br/repositorio-de-modelos/card-lg4.png',
    'https://assets.univesp.br/repositorio-de-modelos/card-lg5.png',
    'https://assets.univesp.br/repositorio-de-modelos/card-lg6.png',
    'https://assets.univesp.br/repositorio-de-modelos/card-lg7.png',
    'https://assets.univesp.br/repositorio-de-modelos/card-lg8.png',
    'https://assets.univesp.br/repositorio-de-modelos/card-lg9.png'
  ];
  
  /**
   * Obtém imagem default baseada no ID do modelo
   * Sempre retorna a mesma imagem para o mesmo ID (consistente)
   */
  static getImagemDefault(id: string): string {
    // Gera índice entre 0-8 baseado no hash do ID
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash = hash & hash;
    }
    const indice = Math.abs(hash % this.IMAGENS_DEFAULT.length);
    return this.IMAGENS_DEFAULT[indice];
  }
  
  /**
   * Obtém imagem para exibição (usa da API ou default)
   */
  static getImagemParaExibicao(modelo: ModeloAPI): string {
    // Se tem imagem na API e não é null/undefined/vazia
    if (modelo.imagemUrl && modelo.imagemUrl.trim() !== '') {
      return modelo.imagemUrl;
    }
    
    // Caso contrário, usa default baseado no ID
    return this.getImagemDefault(modelo.id);
  }
  
  /**
   * Versão simplificada para usar em templates
   */
  static getImagem(modelo: ModeloAPI): string {
    return this.getImagemParaExibicao(modelo);
  }
  
  /**
   * Método para debug/teste
   */
  static testarHash(): void {
    console.log('Teste de hash para imagens default:');
    const idsTeste = [
      '693b1a2bf3da525ae1908cfb',
      '1234567890abcdef',
      'modelo-test-001',
      'abc123',
      'xyz789'
    ];

    idsTeste.forEach(id => {
      const imagem = this.getImagemDefault(id);
      console.log(`${id.substring(0, 10)}... → ${imagem.substring(imagem.length - 15)}`);
    });
  }
}