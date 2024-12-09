import { NgModule } from "@angular/core";
import { EnderecoPipe } from './endereco.pipe';
import { RegiaoPipe } from './regiao.pipe';
import { CepPipe } from './cep.pipe';
import { TelefonePipe } from './telefone.pipe';


@NgModule({
  declarations: [
    EnderecoPipe,
    RegiaoPipe,
    CepPipe,
    TelefonePipe
  ],
  exports: [
    EnderecoPipe,
    RegiaoPipe,
    CepPipe,
    TelefonePipe
  ],
})

export class PipesModule { };