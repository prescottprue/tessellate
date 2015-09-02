import config from '../config';
import storage from '../utils/browserStorage';

class Auth {
	get token() {
		if (storage.exists) {
			storage.getItem(config.tokenName);
		}
	}
	set token(token) {
		if (storage.exists) {
			storage.setItem(config.tokenName, token);
		}
	}

};

export default auth;
