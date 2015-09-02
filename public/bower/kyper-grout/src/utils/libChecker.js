export default (libsArray) => {
	libsArray.forEach((libName) => {
		let libRef = libName;
		//Protect usage of eval
		if (libName.length >= 20 || typeof libName != 'string') {
			return;
		}
		if (typeof window == 'undefined') {
			libRef = `window.${libName}`;
			return;
		}
		if (typeof eval(libName) == 'undefined' || typeof eval(libRef) == 'undefined') {
			console.error(`${libName} is required to use Matter`);
		}
	});
};
