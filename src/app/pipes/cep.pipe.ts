import { Pipe, PipeTransform } from '@angular/core';
import { IAddress } from '../interfaces/footer/address.interface';

@Pipe({
  name: 'cep'
})
export class CepPipe implements PipeTransform {

  transform(cep: IAddress): string {
    
    const CEP_INVALIDO = !cep.cep;

    if(CEP_INVALIDO) {
      return 'CEP indisponível ou inválido';
    }

    return `${cep.cep.substring(0,5)}-${cep.cep.substring(5)}`;

  }

}
