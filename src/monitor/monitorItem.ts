import * as vscode from 'vscode';
import * as path from 'path';
import { SessionSection } from './sessionSection';
import { connectedMonitorItem } from '../monitorsView';

export class MonitorItem extends vscode.TreeItem {

	public isConnected: boolean = false;
	public token: string;
	public environment: string;
	public listSessions: Array<SessionSection>

	constructor(
		public label: string,
		public readonly address: string,
		public readonly port: number,
		public collapsibleState: vscode.TreeItemCollapsibleState,
		public id: string,
		public buildVersion: string,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}

	get tooltip(): string {
		return `Monitor=${this.address} | Port=${this.port}`;
	}

	get description(): string {
		return `${this.address}:${this.port}`;
	}

	get sessions(): Array<SessionSection> {
		return this.listSessions;
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', connectedMonitorItem !== undefined && this.id === connectedMonitorItem.id ? 'monitor.connected.svg' : 'monitor.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', connectedMonitorItem !== undefined && this.id === connectedMonitorItem.id ? 'monitor.connected.svg' : 'monitor.svg')
	};

	contextValue = 'monitorItem';
}