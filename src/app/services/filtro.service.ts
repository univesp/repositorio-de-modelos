import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FiltroService {

  /**
   * Normaliza uma string removendo acentos e caracteres especiais,
   * e convertendo para minúsculas.
   * @param str A string a ser normalizada.
   * @returns A string normalizada.
   */
  private normalizeString(str: string | null | undefined): string {
    if (str === null || str === undefined) {
      return '';
    }
    return str
      .toString()
      .normalize('NFD') // Normaliza para forma de decomposição (separa a letra do acento)
      .replace(/[\u0300-\u036f]/g, '') // Remove os diacríticos (acentos)
      .toLowerCase() // Converte para minúsculas
      .trim(); // Remove espaços em branco extras
  }

  aplicarFiltros(modelos: any[], filtros: { [key: string]: any }): any[] {
    // Log inicial para verificar se o método foi chamado e quais filtros recebeu
    /*
    console.log('FiltroService: Início do aplicarFiltros. Filtros recebidos:', filtros);
    console.log('FiltroService: Quantidade de filtros recebidos (Object.keys().length):', Object.keys(filtros).length);
    */

    if (!filtros || Object.keys(filtros).length === 0) {
      console.log('FiltroService: Nenhum filtro válido. Retornando modelos originais.');
      return modelos;
    }

    /*
    console.log('FiltroService: Modelos a serem filtrados:', modelos.length); // Log da quantidade de modelos
    */
    return modelos.filter(modelo => {
      let match = true; // Assume que o modelo corresponde inicialmente

      // Itera sobre cada filtro vindo da URL
      Object.entries(filtros).forEach(([chave, valorFiltro]) => {
        // Se a correspondência já falhou por um filtro anterior, não precisa verificar os outros
        if (!match) return;

        // Ignora filtros vazios ou inválidos, que não devem afetar a filtragem
        if (valorFiltro === null || valorFiltro === undefined || valorFiltro === '' || valorFiltro === '[Selecione]') {
          return; // Continua para o próximo filtro
        }

        // Lidar com o termo de busca genérico (chave 'search')
        if (chave === 'search') {
          const searchTermNormalized = this.normalizeString(valorFiltro);
         // console.log('FiltroService: Termo de busca normalizado (searchTermNormalized):', searchTermNormalized);

          // IMPORTANTE: AJUSTE ESTES CAMPOS CONFORME AS PROPRIEDADES DO SEU OBJETO MODELO
          const fieldsToSearch = ['titulo']; // Seus campos a serem pesquisados

          let foundInSearchFields = false;
          // Verifica se o termo de busca está presente em algum dos campos definidos
          for (const field of fieldsToSearch) {
            const modelFieldValue = modelo[field];
            const normalizedModelFieldValue = this.normalizeString(modelFieldValue);
            // CORREÇÃO: Removido tags HTML e ajustado para string pura
            //console.log(`FiltroService: Comparando modelo ID ${modelo.id} - campo '${field}' ('${normalizedModelFieldValue}') com termo de busca '${searchTermNormalized}'`);
            if (normalizedModelFieldValue.includes(searchTermNormalized)) {
              foundInSearchFields = true;
              break;
            }
          }
          //console.log(`FiltroService: Resultado da busca para modelo ID ${modelo.id}: Encontrou termo no modelo?`, foundInSearchFields);
          if (!foundInSearchFields) {
            match = false;
          }
          return; // Já processou o filtro 'search', passa para o próximo
        }

        // Filtro especial para TAGS (busca dentro do array de tags)
        if (chave === 'tags') {
          const tagBuscada = this.normalizeString(valorFiltro);
          const tagsDoModelo = modelo['tags'] || [];
          
          let encontrouTag = false;
          for (const tag of tagsDoModelo) {
            const tagNormalizada = this.normalizeString(tag);
            if (tagNormalizada.includes(tagBuscada)) {
              encontrouTag = true;
              break;
            }
          }
          
          if (!encontrouTag) {
            match = false;
          }
          return; // Já processou o filtro 'tags', passa para o próximo
        }

        // Para os demais filtros (não 'search'), realiza a comparação direta da propriedade
        const valorModelo = modelo[chave];

        // Comparação especial para arrays (se o valor do modelo for um array)
        if (Array.isArray(valorModelo)) {
          const normalizedValorModeloArray = valorModelo.map(item => this.normalizeString(item));
          const normalizedValorFiltro = this.normalizeString(valorFiltro);
          //console.log(`FiltroService: Comparando array para chave '${chave}' com '${normalizedValorFiltro}'`);
          if (!normalizedValorModeloArray.includes(normalizedValorFiltro)) {
            match = false;
          }
          return;
        }

        // Comparação especial para números vs strings (para garantir comparação numérica exata)
        if (!isNaN(Number(valorModelo)) && !isNaN(Number(valorFiltro))) {
         // console.log(`FiltroService: Comparando números para chave '${chave}': ${Number(valorModelo)} === ${Number(valorFiltro)}`);
          if (Number(valorModelo) !== Number(valorFiltro)) {
            match = false;
          }
          return;
        }

        // Comparação padrão (case insensitive e sem acentuação)
        const normalizedValorModelo = this.normalizeString(valorModelo);
        const normalizedValorFiltro = this.normalizeString(valorFiltro);
        //console.log(`FiltroService: Comparando strings normalizadas para chave '${chave}': '${normalizedValorModelo}' === '${normalizedValorFiltro}'`);

        if (normalizedValorModelo !== normalizedValorFiltro) {
          match = false;
        }
      });
     // console.log(`FiltroService: Resultado final para modelo ID ${modelo.id || 'N/A'}:`, match);
      return match;
    });
  }
}