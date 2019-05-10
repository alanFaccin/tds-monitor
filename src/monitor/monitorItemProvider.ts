import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { MonitorItem } from './monitorItem';
import { SessionSection } from './sessionSection';
import Utils from '../utils';
import { connectedMonitorItem } from '../monitorsView';

export class MonitorItemProvider implements vscode.TreeDataProvider<MonitorItem | SessionSection> {

	private _onDidChangeTreeData: vscode.EventEmitter<MonitorItem | undefined> = new vscode.EventEmitter<MonitorItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<MonitorItem | undefined> = this._onDidChangeTreeData.event;

	public localMonitorItems: Array<MonitorItem>;

	constructor() {
		this.addMonitorsConfigListener();
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: MonitorItem | SessionSection): vscode.TreeItem {
		if (element instanceof MonitorItem) {
			let iconPath = {
				light: path.join(__filename, '..', '..', '..', 'resources', 'light', connectedMonitorItem !== undefined && element.id === connectedMonitorItem.id ? 'Monitor.connected.svg' : 'Monitor.svg'),
				dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', connectedMonitorItem !== undefined && element.id === connectedMonitorItem.id ? 'Monitor.connected.svg' : 'Monitor.svg')
			};
			element.iconPath = iconPath;
		}
		return element;
	}

	getChildren(element?: MonitorItem): Thenable<MonitorItem[] | SessionSection[]> {
		if (element) {
			if (element.listSessions) {
				return Promise.resolve(element.listSessions);
			}
			else {
				return Promise.resolve([]);
			}
		} else {
			if (!this.localMonitorItems) {
				const serverConfig = Utils.getMonitorsConfig();
				if (!serverConfig || serverConfig.configurations.length <= 0) { //se o monitor.json existe
					this.localMonitorItems = new Array<MonitorItem>();
				} else {
					this.localMonitorItems = this.setConfigWithMonitorConfig();
				}
			}
			return Promise.resolve(this.localMonitorItems);
		}
	}

	private addMonitorsConfigListener(): void {
		let serversJson = Utils.getMonitorConfigFile();
		if (!fs.existsSync(serversJson)) {
			Utils.createMonitorConfig();
		}
		//Caso o arquivo servers.json seja encontrado, registra o listener já na inicialização.
		fs.watch(serversJson, { encoding: 'buffer' }, (eventType, filename) => {
			if (filename && eventType === 'change') {
				this.localMonitorItems = this.setConfigWithMonitorConfig();
				this.refresh();
			}
		});
	}

	/**
	 * Cria os itens da arvore de servidores a partir da leitura do arquivo servers.json
	 */
	private setConfigWithMonitorConfig() {
		const serverConfig = Utils.getMonitorsConfig();
		const serverItem = (serverItem: string, address: string, port: number, id: string, buildVersion: string): MonitorItem => {
			return new MonitorItem(serverItem, address, port, vscode.TreeItemCollapsibleState.None, id, buildVersion, undefined);
		};

		const listServer = new Array<MonitorItem>();

		serverConfig.configurations.forEach(element => {
			listServer.push(serverItem(element.name, element.address, element.port, element.id, element.buildVersion));
		});

		return listServer;
	}

}