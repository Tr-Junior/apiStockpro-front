export interface IEndereco {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
  numero: string;
  complemento: string;
}

export interface IContatos {
  telefone: string;
  email: string;
}

export interface IConfiguracoes {
  abertura: string;
  fechamento: string;
  quantidadeCaixas: number;
}

export interface ICompany {
  id: string;
  nome: string;
  cnpj: string;
  endereco: IEndereco;
  contatos: IContatos;
  configuracoes: IConfiguracoes;
}
