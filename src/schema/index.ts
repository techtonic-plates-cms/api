import {builder} from './builder.ts';
import './auth/index.ts'; // All auth modules (login, users, roles, policies)
import './collections/index.ts';
import './asset/asset.type.ts';
import './asset/asset.queries.ts';
import './asset/asset.mutations.ts';

export const schema = builder.toSchema();