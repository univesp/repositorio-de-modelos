import { IFooter } from "../interfaces/footer/footer.interface";

export const UserFooter: IFooter[] = [
  {
    endereco: {
      rua: 'Av. Paulista',
      numero: 352,
      complemento: '14º andar',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01310000'
    },
    email: 'univesp@univesp.br',
    telefone: '1131886700',
    linksRapidos: [
      {
        titulo: 'Vestibular',
        link: 'https://univesp.br/vestibular'
      },
      {
        titulo: 'Cursos',
        link: 'https://univesp.br/cursos'
      },
      {
        titulo: 'Polos',
        link: 'https://univesp.br/polos'
      },
      {
        titulo: 'Institucional',
        link: 'https://univesp.br/institucional'
      },
      {
        titulo: 'Transparência',
        link: 'https://univesp.br/transparencia'
      }
    ],
    redesSociais: [
      {
        titulo: 'Facebook',
        icone: 'https://img.icons8.com/?size=42&id=118467&format=png&color=ffffff',
        link: 'https://www.facebook.com/pages/UNIVESP-Universidade-Virtual-do-Estado-de-S%C3%A3o-Paulo/1506859409552887',
        alt: 'Icone do Facebook'
      },
      {
        titulo: 'Instagram',
        icone: 'https://img.icons8.com/?size=42&id=32309&format=png&color=ffffff',
        link: 'https://www.instagram.com/univespoficial/',
        alt: 'Icone do Instagram'
      },
      {
        titulo: 'Youtube',
        icone: 'https://img.icons8.com/?size=42&id=37326&format=png&color=ffffff',
        link: 'https://www.youtube.com/channel/UCBL2tfrwhEhX52Dze_aO3zA',
        alt: 'Icone do Youtube'
      }
    ]
  }
]