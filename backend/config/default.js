import * as envs from './env';
let config = envs[process.env.NODE_ENV || 'production'];
console.log('config created:', config);
export default config;
export { envs };
