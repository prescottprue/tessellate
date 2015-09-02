import config from '../config';
import AppsAction from './AppsAction';
import AppAction from './AppAction';

/**
 * User class.
 *
 */
class User {
	constructor(userData) {
		this.name = userData.name;
		this.username = userData.username;
		this.createdAt = userData.createdAt;
		this.updatedAt = userData.updatedAt;
	}
	get apps() {
		return new AppsAction();
	}
	app(appName) {
		//TODO: Attach owner as well ?
		return new AppAction(appName);
	}
}

export default User;

