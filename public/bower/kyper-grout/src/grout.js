import config from './config';
import AppsAction from './classes/AppsAction';
import AppAction from './classes/AppAction';
import UsersAction from './classes/UsersAction';
import UserAction from './classes/UserAction';
import Matter from 'kyper-matter';

/**Grout Client Class
 * @ description Extending matter provides token storage and login/logout/signup capabilities
 */
class Grout extends Matter {
	//TODO: Use getter/setter to make this not a function
	constructor() {
		//Call matter with tessellate
		super('tessellate', {localServer: true});
	}
	//Start a new Apps Action
	get apps() {
		console.log('New AppsAction:', new AppsAction());
		return new AppsAction();
	}
	//Start a new App action
	app(appName) {
		console.log('New AppAction:', new AppAction(appName));
		return new AppAction(appName);
	}
	//Start a new Users action
	get users() {
		return new UsersAction();
	}
	//Start a new User action
	user(username) {
		return new UserAction(username);
	}
};

export default Grout;
