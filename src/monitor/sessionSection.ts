import * as vscode from 'vscode';
import * as path from 'path';

export class SessionSection extends vscode.TreeItem {

	constructor(
		public user: string,
	) {
		super(user);
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'environment.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'environment.svg')
	};

	contextValue = 'envSection';
}