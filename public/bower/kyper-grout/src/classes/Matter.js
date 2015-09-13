import config from '../config';
import Matter from 'kyper-matter';

let matter = new Matter(config.appName, config.matterOptions);
export default matter;
