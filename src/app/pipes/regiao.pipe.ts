import { Pipe, PipeTransform } from '@angular/core';
import { IAddress } from '../interfaces/footer/address.interface';

@Pipe({
  name: 'regiao'
})
export class RegiaoPipe implements PipeTransform {

  transform(regiao: IAddress): string {
    
    const REGIAO_INVALIDA = 
      !regiao ||
      !regiao.bairro ||
      !regiao.cidade ||
      !regiao.estado;

      if(REGIAO_INVALIDA) {
        return 'Região indisponível ou inválida';
      }

      return `${regiao.bairro}, ${regiao.cidade} - ${regiao.estado}`;

  }

}
