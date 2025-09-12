import { GraphQLError } from 'graphql';

export class GraphQLAuthError extends GraphQLError {
  constructor(message: string, code: string) {
    super(message, {
      extensions: {
        code,
        http: {
          status: code === 'UNAUTHENTICATED' ? 401 : 403
        }
      }
    });
  }
}