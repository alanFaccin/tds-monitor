import * as vscode from 'vscode';
import * as path from 'path';

export class SessionSection extends vscode.TreeItem {

	constructor(
		public user: string,
		public id: any,
		public obs: string,
		public envi: string,
		public time: string
	) {
		super(user);
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'environment.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'environment.svg')
	};

	contextValue = 'envSection';

	get tooltip(): string {
		return `ENV=${this.envi} | Time Elapsed=${this.time}`;
	}

	get description(): string{
		return `ID=${this.id} | Main=${this.obs}`;
	}
}