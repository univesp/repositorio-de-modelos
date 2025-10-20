export interface User {
  id: string,
  email: string,
  senha: string,
  nome: string,
  imagem: File | string,
  instituicao: string,
  cargo: string,
  nivelAcesso: string,
  salvos: object[]
}