export class ErroDeNegocio extends Error {
  readonly status: 400 | 403 | 409;

  constructor(mensagem: string, status: 400 | 403 | 409) {
    super(mensagem);
    this.name = 'ErroDeNegocio';
    this.status = status;
  }
}
