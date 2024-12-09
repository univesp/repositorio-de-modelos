import { Pipe, PipeTransform } from '@angular/core';
import { IAddress } from '../interfaces/footer/address.interface';

@Pipe({
  name: 'endereco'
})
export class EnderecoPipe implements PipeTransform {

  transform(endereco: IAddress): string {
    
    const ENDERECO_INVALIDO = 
      !endereco ||
      !endereco.rua ||
      endereco.numero === null || endereco.numero === undefined;

    const ENDERECO_SEM_COMPLEMENTO = 
      !endereco.complemento || endereco.complemento === "";

      if(ENDERECO_INVALIDO) {
        return 'Endereço indisponível ou inválido';
      }

      if(ENDERECO_SEM_COMPLEMENTO) {
        return `${endereco.rua}, nº ${endereco.numero}`;
      }

      return `${endereco.rua}, nº ${endereco.numero}, ${endereco.complemento}`;

  }

}
