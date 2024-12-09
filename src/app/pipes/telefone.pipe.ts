import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'telefone'
})
export class TelefonePipe implements PipeTransform {

  transform(telefone: string): string {
    const TELFONE_INVALIDO = !telefone;

    if(TELFONE_INVALIDO) {
      return 'CEP indisponível ou inválido';
    }

    return `+55 ${telefone.substring(0, 2)} ${telefone.substring(2, 6)}-${telefone.substring(6)}`;
  }

}
