interface ItemSocialMedia {
  titulo: string;
  icone: string;
  link: string;
  alt: string;
}

export interface ISocialMedia extends Array<ItemSocialMedia> { };