import config from '../config';

class File {
	constructor(fileData) {
		this.type = 'file';
		this.path = fileData.path;
		let pathArray = this.path.split('/');
		this.name = pathArray[pathArray.length - 1];
		let re = /(?:\.([^.]+))?$/;
		this.ext = re.exec(this.name)[1];
		console.log('new file constructed:', this);
	}
	getTypes() {
		//Get content type and file type from extension
	}
	open() {
		//TODO:Return file contents
	}
	openWithFirepad(divId) {
		//TODO:Create new Firepad instance within div
	}
	getDefaultContent() {

	}
}
export default File;
