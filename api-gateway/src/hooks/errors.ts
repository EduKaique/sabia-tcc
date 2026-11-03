export class GatewayError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'GatewayError';
    this.statusCode = statusCode;
  }
}

export class ServiceUnavailableError extends GatewayError {
  constructor(service: string) {
    super(502, `Serviço "${service}" indisponível. Tente novamente mais tarde.`);
    this.name = 'ServiceUnavailableError';
  }
}

export class UnauthorizedError extends GatewayError {
  constructor(message = 'Token inválido ou ausente.') {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends GatewayError {
  constructor(message = 'Acesso negado.') {
    super(403, message);
    this.name = 'ForbiddenError';
  }
}

/** Token com troca de senha pendente: só a troca (no auth-service) fica liberada. */
export class SenhaTemporariaError extends GatewayError {
  readonly codigo = 'SENHA_TEMPORARIA';

  constructor() {
    super(403, 'Você precisa trocar sua senha para continuar.');
    this.name = 'SenhaTemporariaError';
  }
}

export class BadRequestError extends GatewayError {
  constructor(message = 'Requisição inválida.') {
    super(400, message);
    this.name = 'BadRequestError';
  }
}

export class NotFoundError extends GatewayError {
  constructor(resource = 'Recurso') {
    super(404, `${resource} não encontrado.`);
    this.name = 'NotFoundError';
  }
}

export class TimeoutError extends GatewayError {
  constructor(service: string) {
    super(504, `Tempo limite excedido ao conectar com "${service}".`);
    this.name = 'TimeoutError';
  }
}
