import { IAddress } from "./address.interface"; 
import { ILinks } from "./links.interface";
import { ISocialMedia } from "./socialMedia.interface";

export interface IFooter {
  endereco: IAddress;
  email: string;
  telefone: string;
  linksRapidos: ILinks;
  redesSociais: ISocialMedia;
}