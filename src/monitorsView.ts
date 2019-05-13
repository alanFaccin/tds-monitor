import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as nls from 'vscode-nls';
import Utils from './utils';
import { MonitorItem } from './monitor/monitorItem';
import { languageClient } from './extension';
import { inputConnectionParameters } from './inputConnectionParameters';
import { MonitorItemProvider } from './monitor/monitorItemProvider';
import { SessionSection } from './monitor/sessionSection';
import * as compile from 'template-literal';

let localize = nls.loadMessageBundle();

const localizeHTML = {
	"tds.webview.newServer.title": localize("tds.webview.newServer.title", "New Server for monitor"),
	"tds.webview.newServer.name": localize("tds.webview.newServer.name", "Server Name"),
	"tds.webview.newServer.address": localize("tds.webview.newServer.address", "Address"),
	"tds.webview.newServer.port": localize("tds.webview.newServer.port", "Port"),
	"tds.webview.newServer.save": localize("tds.webview.newServer.save", "Save"),
	"tds.webview.newServer.saveClose": localize("tds.webview.newServer.saveClose", "Save/Close")
}

export let connectedMonitorItem: MonitorItem | undefined;
let currentPanel: vscode.WebviewPanel | undefined = undefined;

const treeDataProvider = new MonitorItemProvider();
export class MonitorsExplorer {

	constructor(context: vscode.ExtensionContext) {
		vscode.window.createTreeView('totvs_monitor', { treeDataProvider });

		vscode.window.registerTreeDataProvider('totvs_monitor', treeDataProvider);

		//Adiciona novo item a visão de monitor
		context.subscriptions.push(vscode.commands.registerCommand('totvs-monitor.add', () => addMonitor(currentPanel, context)));
		//Comando para renomear item da visão de monitor
		context.subscriptions.push(vscode.commands.registerCommand('totvs-developer-studio.rename', (serverItem: MonitorItem) => renameMonitor(serverItem)));
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
			connType: 13,
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
		serverItem.token = token;
		if (token) {
			sendGetUsersRequest(serverItem);
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

function sendGetUsersRequest(serverItem: MonitorItem) {
	languageClient.sendRequest('$totvsmonitor/getUsers', {
		getUsersInfo: {
			connectionToken: serverItem.token
		}
	}).then((response: GetUsersResult) => {
		if (response && treeDataProvider) {
			connectedMonitorItem = serverItem;
			const listSessions:Array<SessionSection> = getSessionList(response.mntUsers);
			connectedMonitorItem.listSessions = listSessions;

			serverItem.listSessions = listSessions;

			let index = 0;
			const lengthTree = treeDataProvider.localMonitorItems.length;
			for(index = 0; index < lengthTree; index++){
				const idTree:string = treeDataProvider.localMonitorItems[index].id;
				if(idTree == serverItem.id){
					break;
				}
			}

			treeDataProvider.localMonitorItems[index].listSessions = serverItem.listSessions;
			treeDataProvider.localMonitorItems[index].collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
			//Workaround: Bug que nao muda visualmente o collapsibleState se o label permanecer intalterado
			treeDataProvider.localMonitorItems[index].label = treeDataProvider.localMonitorItems[index].label.endsWith(' ') ? treeDataProvider.localMonitorItems[index].label.trim() : treeDataProvider.localMonitorItems[index].label + ' ';

			treeDataProvider.refresh();
		}
		return true;
	}, err => {
		vscode.window.showErrorMessage(err);
	});
}

function getSessionList(user: Array<MntUser>){
	const listSessions:Array<SessionSection> = new Array<SessionSection>();

	user.forEach(element => {
		const obs = element.remark.toLowerCase();
		if(obs.indexOf('developer') >= 0){
			element.mainName = "TDS";
		}
		listSessions.push(new SessionSection(element.computerName, element.threadId, element.mainName, element.environment, element.elapsedTime));
	});

	return listSessions;
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

class GetUsersResult {
	mntUsers: Array<MntUser>;
}

function handleError(nodeError: NodeError) {
	vscode.window.showErrorMessage(nodeError.code + ': ' + nodeError.message);
}

export function connectMonitor(monitorItem, context) {
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
					inputConnectionParameters(context, monitorItem);
				} else {
					vscode.window.showErrorMessage("Clould not connect to Monitor");
				}
				return;
			}, (err) => {
				vscode.window.showErrorMessage(err.message);
			});
		}
	} else {
		vscode.window.showErrorMessage(localize("tds.vscode.server.not.connected", "To connect to the monitor, it is necessary to connect any Server."));
	}
}

export function disconnectMonitor(serverItem) {
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
}

function renameMonitor(serverItem) {
	let ix = treeDataProvider.localMonitorItems.indexOf(serverItem);
	if (ix >= 0) {
		vscode.window.showInputBox({
			placeHolder: "Rename the Monitor",
			value: serverItem.label
		}).then((newName: string) => {
			Utils.updateServerName(serverItem.id, newName)
		});
	}
}

function addMonitor(currentPanel, context) {
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

		currentPanel.webview.html = getWebViewContent(context, localizeHTML);
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
}

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

function getWebViewContent(context, localizeHTML) {

	const htmlOnDiskPath = vscode.Uri.file(path.join(context.extensionPath, 'src', 'server', 'addServer.html'));
	const cssOniskPath = vscode.Uri.file(path.join(context.extensionPath, 'resources', 'css', 'form.css'));

	const htmlContent = fs.readFileSync(htmlOnDiskPath.with({ scheme: 'vscode-resource' }).fsPath);
	const cssContent = fs.readFileSync(cssOniskPath.with({ scheme: 'vscode-resource' }).fsPath);

	let runTemplate = compile(htmlContent);

	return runTemplate({ css: cssContent, localize: localizeHTML });
}