import * as envs from './env';
let config = envs[process.env.NODE_ENV || 'production'];
export default config;
export { envs };
