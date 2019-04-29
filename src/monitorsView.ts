import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import Utils from './utils';
import * as nls from 'vscode-nls';
import { languageClient } from './extension';
import { inputConnectionParameters } from './inputConnectionParameters';

let localize = nls.loadMessageBundle();
const compile = require('template-literal');

const localizeHTML = {
	"tds.webview.newServer.title": localize("tds.webview.newServer.title","New Server"),
	"tds.webview.newServer.name": localize("tds.webview.newServer.name","Server Name"),
	"tds.webview.newServer.address": localize("tds.webview.newServer.address","Address"),
	"tds.webview.newServer.port": localize("tds.webview.newServer.port","Port"),
	"tds.webview.newServer.save": localize("tds.webview.newServer.save","Save"),
	"tds.webview.newServer.saveClose": localize("tds.webview.newServer.saveClose","Save/Close")
}

export let connectedMonitorItem: MonitorItem | undefined;

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
				light: path.join(__filename, '..', '..', 'resources', 'light', connectedMonitorItem !== undefined && element.id === connectedMonitorItem.id ? 'Monitor.connected.svg' : 'Monitor.svg'),
				dark: path.join(__filename, '..', '..', 'resources', 'dark', connectedMonitorItem !== undefined && element.id === connectedMonitorItem.id ? 'Monitor.connected.svg' : 'Monitor.svg')
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
				if ( !serverConfig || serverConfig.configurations.length <= 0) { //se o monitor.json existe
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

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', connectedMonitorItem !== undefined && this.id === connectedMonitorItem.id ? 'monitor.connected.svg' : 'monitor.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', connectedMonitorItem !== undefined && this.id === connectedMonitorItem.id ? 'monitor.connected.svg' : 'monitor.svg')
	};

	contextValue = 'serverItem';
}

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

const treeDataProvider = new MonitorItemProvider();
export class MonitorsExplorer {

	constructor(context: vscode.ExtensionContext) {
		vscode.window.createTreeView('totvs_monitor', { treeDataProvider });

		vscode.window.registerTreeDataProvider('totvs_monitor', treeDataProvider);

		vscode.commands.registerCommand('totvs-monitor.connect', (monitorItem) => {
			let ix = treeDataProvider.localMonitorItems.indexOf(monitorItem);
			if (ix >= 0) {
				//Verifica se ha um buildVersion cadastrado.
				if (monitorItem.buildVersion) {
					inputConnectionParameters(context, monitorItem);
				} else {
					//Há build no servidor.
					languageClient.sendRequest('$totvsserver/validation', {
						validationInfo: {
							Monitor: monitorItem.address,
							port: monitorItem.port
						}
					}).then((validInfoNode: NodeInfo) => {
						//retornou uma versao valida no servidor.
						const updated = Utils.updateBuildVersion(monitorItem.id, validInfoNode.buildVersion);
						monitorItem.buildVersion = validInfoNode.buildVersion;
						if (updated) {
							//continua a autenticacao.
							//inputConnectionParameters(context, serverItem);
						} else {
							vscode.window.showErrorMessage("Clould not connect to Monitor");
						}
						return;
					}, (err) => {
						vscode.window.showErrorMessage(err.message);
					});
				}
				//commands.executeCommand('totvs-developer-studio.serverAuthentication', serverItem.Monitor, serverItem.port, serverItem.timeStamp, serverItem.id, serverItem.label);

				//Comentado a criacao de ambientes. Para reatilet é só preencher a lista de ambientes abaixo.
				// const listOfEnvironments = ['P12'];
				// treeDataProvider.localServerItems[ix].users = listOfEnvironments.map(env => new EnvSection(env, serverItem.label, vscode.TreeItemCollapsibleState.None, {
				// 	command: 'totvs_server.selectEnvironment',
				// 	title: '',
				// 	arguments: [env]
				// }));
				// treeDataProvider.localServerItems[ix].collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
				// //Workaround: Bug que nao muda visualmente o collapsibleState se o label permanecer intalterado
				// treeDataProvider.localServerItems[ix].label = treeDataProvider.localServerItems[ix].label.endsWith(' ') ? treeDataProvider.localServerItems[ix].label.trim() : treeDataProvider.localServerItems[ix].label + ' ';
				// treeDataProvider.refresh();
			}else{
				vscode.window.showErrorMessage(localize("tds.vscode.server.not.connected","To connect to the monitor, it is necessary to connect any Server."));
			}
		});

		vscode.commands.registerCommand('totvs-monitor.disconnect', (serverItem: MonitorItem) => {
			if (connectedMonitorItem !== undefined && serverItem.id === connectedMonitorItem.id) {
				languageClient.sendRequest('$totvsserver/disconnect', {
					disconnectInfo: {
						connectionToken: connectedMonitorItem.token,
						serverName: connectedMonitorItem.label
					}
				}).then((disconnectInfo: DisconnectReturnInfo) => {
					if (disconnectInfo !== undefined && disconnectInfo.code === undefined) {
						connectedMonitorItem = undefined;
						Utils.clearConnectedServerConfig();
						if (treeDataProvider !== undefined) {
							treeDataProvider.refresh();
						}
					}
				}, (err) => {
					Utils.clearConnectedServerConfig();
					if (treeDataProvider !== undefined) {
						treeDataProvider.refresh();
					}
					handleError(err);
				});
			} else {
				vscode.window.showInformationMessage("Monitor is already disconnected");
			}
		});


		/*
		vscode.commands.registerCommand('totvs-developer-studio.selectenv', (environment: EnvSection) => {
			const config = vscode.workspace.getConfiguration("launch", null);
			const configs = config.get<any[]>("configurations");
			if (configs) {
				configs.forEach(element => {
					if (element.type === 'totvs_language_debug') {
						element.serverItem = environment.serverItemParent.trim();
						element.environment = environment.label;
					}
				});
				config.update("configurations", configs);
			}
		});
		*/
		let currentPanel: vscode.WebviewPanel | undefined = undefined;
		/*
		vscode.commands.registerCommand('totvs-developer-studio.delete', (serverItem: MonitorItem) => {
			let ix = treeDataProvider.localMonitorItems.indexOf(serverItem);
			if (ix >= 0) {
				Utils.deleteServer(serverItem.id);
			}

		});
		*/

		/*
		vscode.commands.registerCommand('totvs-developer-studio.rename', (serverItem: MonitorItem) => {
			let ix = treeDataProvider.localMonitorItems.indexOf(serverItem);
			if (ix >= 0) {
				vscode.window.showInputBox({
					placeHolder: "Rename the Monitor",
					value: serverItem.label
				}).then((newName: string) => {
					Utils.updateServerName(serverItem.id, newName)
				});
			}

		})
		*/

		vscode.commands.registerCommand('totvs-monitor.add', () => {

			if (currentPanel) {
				currentPanel.reveal();
			} else {
				currentPanel = vscode.window.createWebviewPanel(
					'totvs-monitor.add',
					'Novo Servidor',
					vscode.ViewColumn.One,
					{
						enableScripts: true,
						localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'src', 'server'))],
						retainContextWhenHidden: true
					}
				);

				currentPanel.webview.html = getWebViewContent(context,localizeHTML);
				currentPanel.onDidDispose(
					() => {
						currentPanel = undefined;
					},
					null,
					context.subscriptions
				);

				currentPanel.webview.onDidReceiveMessage(message => {
					switch (message.command) {
						case 'saveServer':
							const typeServer = "totvs_server_protheus";
							if (message.serverName && message.port && message.address) {
								const serverId = createMonitor(typeServer, message.serverName, message.port, message.address, "", true);
								if (serverId !== undefined) {
									languageClient.sendRequest('$totvsserver/validation', {
										validationInfo: {
											server: message.address,
											port: parseInt(message.port),
										}
									}).then((validInfoNode: NodeInfo) => {
										Utils.updateBuildVersion(serverId, validInfoNode.buildVersion);
										return;
									}, (err) => {
										vscode.window.showErrorMessage(err);
									})
								}
							} else {
								vscode.window.showErrorMessage("Add Monitor Fail. Name, port and Address are need")
							}

							if (currentPanel) {
								if (message.close) {
									currentPanel.dispose();
								}
							}
					}
				},
					undefined,
					context.subscriptions
				);
			}
		});


		function createMonitor(typeServer: string, serverName: string, port: number, address: string, buildVersion: string, showSucess: boolean): string | undefined {
			const serverId = Utils.createNewMonitor(typeServer, serverName, port, address, buildVersion);

			if (treeDataProvider !== undefined) {
				treeDataProvider.refresh();
			}
			if (showSucess) {
				vscode.window.showInformationMessage("Saved Monitor " + serverName);
			}
			return serverId;
		}


		function getWebViewContent(context, localizeHTML){

			const htmlOnDiskPath = vscode.Uri.file(path.join(context.extensionPath, 'src', 'server', 'addServer.html'));
			const cssOniskPath = vscode.Uri.file(path.join(context.extensionPath, 'resources', 'css', 'form.css'));

			const htmlContent = fs.readFileSync(htmlOnDiskPath.with({ scheme: 'vscode-resource' }).fsPath);
			const cssContent = fs.readFileSync(cssOniskPath.with({ scheme: 'vscode-resource' }).fsPath);

			let runTemplate = compile(htmlContent);

			return runTemplate({css: cssContent,localize: localizeHTML});
		}

	}

}

export function authenticate(serverItem: MonitorItem, environment: string, username: string, password: string) {
	if (connectedMonitorItem !== undefined && connectedMonitorItem.id === serverItem.id) {
		vscode.window.showInformationMessage("The Monitor selected is already connected.");
	}
	//vscode.window.showInformationMessage("Initializing connection with Monitor " + serverItem.label);
	if (connectedMonitorItem !== undefined) {
		vscode.commands.executeCommand('totvs-developer-studio.disconnect', connectedMonitorItem).then(() => {
			sendAuthenticateRequest(serverItem, environment, username, password);
		});
	} else {
		sendAuthenticateRequest(serverItem, environment, username, password);
	}
}

function sendAuthenticateRequest(serverItem: MonitorItem, environment: string, user: string, password: string) {
	languageClient.sendRequest('$totvsserver/authentication', {
		authenticationInfo: {
			connType: 1,
			identification: serverItem.id,
			server: serverItem.address,
			port: serverItem.port,
			buildVersion: serverItem.buildVersion,
			environment: environment,
			user: user,
			password: password,
			autoReconnect: true
		}
	}).then((authenticationNode: AuthenticationNode) => {
		let token: string = authenticationNode.connectionToken;
		if (token) {
			//vscode.window.showInformationMessage('Monitor ' + serverItem.label + ' connected!');
			Utils.saveSelectMonitor(serverItem.id, token, serverItem.label, environment, user);
			if (treeDataProvider !== undefined) {
				connectedMonitorItem = serverItem;
				connectedMonitorItem.environment = environment;
				connectedMonitorItem.token = token;
				treeDataProvider.refresh();
			}
			return true;
		} else {
			vscode.window.showErrorMessage('Error connecting Monitor');
			return false;
		}
	}, err => {
		vscode.window.showErrorMessage(err);
	});
}

export class AuthenticationNode {
	// These properties come directly from the language Monitor.
	id: any;
	osType: number;
	connectionToken: string;
}

export class NodeInfo {
	id: any;
	buildVersion: string;
}

class DisconnectReturnInfo {
	id: any;
	code: any;
	message: string;
}

class NodeError {
	code: number;
	message: string;
}

function handleError(nodeError: NodeError) {
	vscode.window.showErrorMessage(nodeError.code + ': ' + nodeError.message);
}
