import { NgModule } from "@angular/core";
import { EnderecoPipe } from './endereco.pipe';
import { RegiaoPipe } from './regiao.pipe';
import { CepPipe } from './cep.pipe';
import { TelefonePipe } from './telefone.pipe';
import { BytesFormatPipe } from "./bytes-format.pipe";


@NgModule({
  declarations: [
    EnderecoPipe,
    RegiaoPipe,
    CepPipe,
    TelefonePipe,
    BytesFormatPipe
  ],
  exports: [
    EnderecoPipe,
    RegiaoPipe,
    CepPipe,
    TelefonePipe,
    BytesFormatPipe
  ],
})

export class PipesModule { };