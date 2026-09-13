export const env = {
  PORT: Number(process.env.GATEWAY_PORT) || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  upstreams: {
    // ALTERAR NA MEDIDA QUE AUMENTAREM OS MICROSSERVIÇOS
    main:    process.env.AUTH_URL    || 'http://localhost:8081',
  },
};
