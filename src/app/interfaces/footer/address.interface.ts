export interface IAddress {
  rua: string;
  numero: number;
  complemento: string | undefined | null;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}