import * as vscode from 'vscode';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import * as stripJsonComments from 'strip-json-comments';
import * as os from 'os';

const homedir = os.homedir();

import * as nls from 'vscode-nls';
let localize = nls.loadMessageBundle();

export interface SelectMonitor {
	name: string;
	id: string;
	token: string;
	environment: string;
	sessions?: string[];
	isConnected: boolean;
}

export default class Utils {
	/**
	* Subscrição para evento de seleção de servidor/ambiente.
	*/
	static get onDidSelectedServer(): vscode.Event<SelectMonitor> {
		return Utils._onDidSelectedMonitor.event;
	}

	/**
	 * Subscrição para evento de login no identity
	 */
	static get onDidLoginIdentity(): vscode.Event<string> {
		return Utils._onDidLoginIdentity.event;
	}

	/**
	 * Emite a notificação de seleção de servidor/ambiente
	 */
	private static _onDidSelectedMonitor = new vscode.EventEmitter<SelectMonitor>();

	/**
	 * Emite a notificação de login no identity
	 */
	private static _onDidLoginIdentity = new vscode.EventEmitter<string>();

	/**
	 * Gera um id de servidor
	 */
	static generateRandomID() {
		return Math.random().toString(36).substring(2, 15) + Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
	}

	/**
	 * Retorna o path completo do servers.json
	 */
	static getMonitorConfigFile() {
		return homedir + "/.totvsls/monitor.json";
	}

	/**
	 * Retorna o path de onde deve ficar o servers.json
	 */
	static getMonitorConfigPath() {
		return homedir + "/.totvsls";
	}

	/**
 * Retorna o path completo do launch.json
 */
	static getLaunchConfigFile() {
		return vscode.workspace.rootPath + "/.vscode/launch.json";
	}

	/**
	 * Retorna o path da pastar .vscode dentro do workspace
	 */
	static getVSCodePath() {
		return vscode.workspace.rootPath + "/.vscode";
	}

	/**
	 * Retorna todo o conteudo do servers.json
	 */
	static getMonitorsConfig() {
		let fs = require('fs');
		let exist = fs.existsSync(this.getMonitorConfigFile());
		if (exist) {
			let json = fs.readFileSync(this.getMonitorConfigFile()).toString();
			return JSON.parse(json);
		}
	}

	/**
	 * Retorna todo o conteudo do launch.json
	 */
	static getLaunchConfig() {
		let fs = require('fs');
		let exist = fs.existsSync(this.getLaunchConfigFile());
		if (exist) {
			let json = fs.readFileSync(this.getLaunchConfigFile()).toString();
			return JSON.parse(stripJsonComments(json));
		}
	}

	static saveLaunchConfig(config: JSON) {
		let fs = require('fs');
		fs.writeFileSync(Utils.getLaunchConfigFile(), JSON.stringify(config, null, "\t"), (err) => {
			if (err) {
				console.error(err);
			}
		});
	}

	/**
	 * Salva o servidor logado por ultimo.
	 * @param id Id do servidor logado
	 * @param token Token que o LS gerou em cima das informacoes de login
	 * @param name Nome do servidor logado
	 * @param environment Ambiente utilizado no login
	 */
	static saveSelectMonitor(id: string, token: string, name: string, environment: string, username: string) {
		const servers = this.getMonitorsConfig();

		servers.configurations.forEach(element => {
			if (element.id === id) {
				if (element.environments === undefined) {
					element.environments = [environment];
				} else if (element.environments.indexOf(environment) === -1) {
					element.environments.push(environment);
				}
				element.username = username;
				element.environment = environment;

				let server: SelectMonitor = {
					'name': element.name,
					'id': element.id,
					'token': token,
					'environment': element.environment,
					'isConnected': true
				};
				servers.connectedServer = server;
				Utils._onDidSelectedMonitor.fire(server);
			}
		});

		this.persistMonitorsInfo(servers);
	}
	/**
	 * Notifica o cancelamento de seleção de servidor/ambiente
	 */
	static cancelSelectMonitor() {
		Utils._onDidSelectedMonitor.fire(undefined);
	}

	/**
	 *Deleta o servidor logado por ultimo do servers.json
	 */
	static deleteSelectServer() {
		const servers = this.getMonitorsConfig();
		if (servers.connectedServer.id) {
			let server = {};
			servers.connectedServer = server;
			this.persistMonitorsInfo(servers);
		}
	}

	static clearConnectedServerConfig() {
		const allConfigs = this.getMonitorsConfig();

		allConfigs.connectedServer = {};
		this.persistMonitorsInfo(allConfigs);
		Utils.cancelSelectMonitor();
	}

	/**
 *Deleta o servidor logado por ultimo do servers.json
 */
	static deleteServer(id: string) {
		const allConfigs = this.getMonitorsConfig();

		if (allConfigs.configurations) {
			const configs = allConfigs.configurations;

			configs.forEach(element => {
				if (element.id === id) {
					const index = configs.indexOf(element, 0);
					configs.splice(index, 1);
					this.persistMonitorsInfo(allConfigs);
					return;
				}
			});
		}
	}

	/**
	 * Grava no arquivo servers.json uma nova configuracao de servers
	 * @param JSONServerInfo
	 */
	static persistMonitorsInfo(JSONMonitorInfo) {
		let fs = require('fs');
		fs.writeFileSync(Utils.getMonitorConfigFile(), JSON.stringify(JSONMonitorInfo, null, "\t"), (err) => {
			if (err) {
				console.error(err);
			}
		});
	}

	/**
 * Grava no arquivo launch.json uma nova configuracao de launchs
 * @param JSONMonitorInfo
 */
	static persistLaunchsInfo(JSONLaunchInfo) {
		let fs = require('fs');
		fs.writeFileSync(Utils.getLaunchConfigFile(), JSON.stringify(JSONLaunchInfo, null, "\t"), (err) => {
			if (err) {
				console.error(err);
			}
		});
	}

	/**
	 * Cria uma nova configuracao de servidor no monitor.json
	 */
	static createNewMonitor(typeServer, serverName, port, address, buildVersion): string | undefined {
		this.createMonitorConfig();
		const serverConfig = Utils.getMonitorsConfig();

		if (serverConfig.configurations) {
			const servers = serverConfig.configurations;
			const serverId: string = Utils.generateRandomID();
			servers.push({
				id: serverId,
				type: typeServer,
				name: serverName,
				port: parseInt(port),
				address: address,
				buildVersion: buildVersion
			});

			Utils.persistMonitorsInfo(serverConfig);
			return serverId;
		}
		return undefined;
	}

	/**
	 * Recupera o ultimo servidor logado
	 */
	static getCurrentMonitor() {
		const monitors = this.getMonitorsConfig();

		if (monitors.connectedServer.id) {
			return monitors.connectedServer;
		} else {
			return "";
		}
	}

	static getIdentityInfos() {
		const monitors = this.getMonitorsConfig();

		const identity = monitors.identity;
		if (identity) {
			return identity;
		}

		return "";
	}


	static saveIdentityInfos(infos: any) {
		const config = Utils.getMonitorsConfig();

		config.identity = infos;

		this.persistMonitorsInfo(config);
		Utils._onDidLoginIdentity.fire(infos);
	}

	static saveTokenIdentity(token: string) {
		const config = Utils.getMonitorsConfig();

		config.identity = {
			"authorizationToken": token
		};

		this.persistMonitorsInfo(config);
		Utils._onDidLoginIdentity.fire(token);
	}

	/**
	 * Recupera a lista de includes do arquivod servers.json
	 */
	static getIncludes(absolutePath: boolean = false) {
		const servers = this.getMonitorsConfig();
		const includes: Array<string> = servers.includes as Array<string>;

		if (servers.includes) {
			if (absolutePath) {
				const ws: string = vscode.workspace.rootPath || '';
				includes.forEach((value, index, elements) => {
					if (value.startsWith(".")) {
						value = path.resolve(ws, value);
					} else {
						value = path.resolve(value.replace('${workspaceFolder}', ws));
					}

					try {
						const fi: fs.Stats = fs.lstatSync(value);
						if (!fi.isDirectory) {
							const msg: string = localize("tds.webview.utils.reviewList", "Review the folder list in order to search for settings (.ch). Not recognized as folder: {0}", value);
							vscode.window.showWarningMessage(msg);
						} else {
							elements[index] = value;
						}

					} catch (error) {
						const msg: string = localize("tds.webview.utils.reviewList2", "Review the folder list in order to search for settings (.ch). Invalid folder: {0}", value);
						console.log(error);
						vscode.window.showWarningMessage(msg);
						elements[index] = "";
					}
				});
			}

			return includes;
		} else {
			vscode.window.showWarningMessage(localize("tds.webview.utils.listFolders", 'List of folders to search for definitions not configured.'));
			return undefined;
		}
	}

	/**
	 * Cria o arquivo monitor.json caso ele nao exista.
	 */
	static createMonitorConfig() {
		const servers = Utils.getMonitorsConfig();
		if (!servers) {
			let fs = require("fs");
			const sampleMonitor = {
				version: "0.2.0",
				identity: {
					authorizationtoken: ""
				},
				connectedMonitor: {},
				configurations: []
			};

			if (!fs.existsSync(Utils.getMonitorConfigPath())) {
				fs.mkdirSync(Utils.getMonitorConfigPath());
			}

			let monitorsJson = Utils.getMonitorConfigFile();

			fs.writeFileSync(monitorsJson, JSON.stringify(sampleMonitor, null, "\t"), (err) => {
				if (err) {
					console.error(err);
				}
			});
		}
	}
	/**
	 * Cria o arquivo launch.json caso ele nao exista.
	 */
	static createLaunchConfig() {
		const launch = Utils.getLaunchConfig();
		if (!launch) {
			let fs = require("fs");
			//Essa configuracao veio do package.json. Deveria ler de la, mas nao consegui
			const sampleLaunch = {
				"version": "0.2.0",
				"configurations": [
					{
						"type": "totvs_language_debug",
						"request": "launch",
						"name": "Totvs Language Debug",
						"program": "${command:AskForProgramName}",
						"cwb": "${workspaceFolder}",
						"smartclientBin": ""
					}
				]
			};

			if (!fs.existsSync(Utils.getVSCodePath())) {
				fs.mkdirSync(Utils.getVSCodePath());
			}

			let launchJson = Utils.getLaunchConfigFile();

			fs.writeFileSync(launchJson, JSON.stringify(sampleLaunch, null, "\t"), (err) => {
				if (err) {
					console.error(err);
				}
			});
		}
	}
	/**
	 *Recupera um servidor pelo ID informado.
	 * @param ID ID do servidor que sera selecionado.
	 */
	static getServerForID(ID: string) {
		let server;
		const allConfigs = this.getMonitorsConfig();

		if (allConfigs.configurations) {
			const configs = allConfigs.configurations;

			configs.forEach(element => {
				if (element.id === ID) {
					server = element;
					if (server.environments === undefined) {
						server.environments = [];
					}
				}
			});
		}
		return server;
	}

	/**
 	*Recupera um servidor pelo nome informado.
 	* @param name nome do servidor alvo.
 	*/
	static getServerForNameWithConfig(name: string, serversConfig: any) {
		let server;

		if (serversConfig.configurations) {
			const configs = serversConfig.configurations;

			configs.forEach(element => {
				if (element.name === name) {
					server = element;
					if (server.environments === undefined) {
						server.environments = [];
					}
				}
			});
		}
		return server;
	}

	static addCssToHtml(htmlFilePath: vscode.Uri, cssFilePath: vscode.Uri) {

		const htmlContent = fs.readFileSync(htmlFilePath.with({ scheme: 'vscode-resource' }).fsPath);
		const cssContent = fs.readFileSync(cssFilePath.with({ scheme: 'vscode-resource' }).fsPath);

		const $ = cheerio.load(htmlContent.toString());

		let style = $('style').html();

		if (style === undefined || style === null || style === "") {
			$('html').append('<style>' + cssContent + '</style>');
		} else {
			$('style').append(cssContent.toString());
		}

		return $.html();
	}
	/**
	 *Salva uma nova configuracao de include.
	 */
	static saveIncludePath(path) {
		const servers = this.getMonitorsConfig();

		servers.includes = path;

		this.persistMonitorsInfo(servers);
	}

	/**
	 *Atualiza no server.json a build de um servidor
	 * @param id ID do server que sera atualizado
	 * @param buildVersion Nova build do servidor
	 */
	static updateBuildVersion(id: string, buildVersion: string) {
		let result = false;
		if (!id || !buildVersion) {
			return result;
		}
		const monitorConfig = this.getMonitorsConfig();
		monitorConfig.configurations.forEach(element => {
			if (element.id === id) {
				element.buildVersion = buildVersion;
				this.persistMonitorsInfo(monitorConfig);
				result = true;
			}
		});

		return result;
	}

	/**
	 *Atualiza no server.json o nome de um servidor
	 * @param id ID do server que sera atualizado
	 * @param newName Novo nome do servidor
	 */
	static updateServerName(id: string, newName: string) {
		let result = false;
		if (!id || !newName) {
			return result;
		}
		const serverConfig = this.getMonitorsConfig();
		serverConfig.configurations.forEach(element => {
			if (element.id === id) {
				element.name = newName;
				this.persistMonitorsInfo(serverConfig);
				result = true;
			}
		});

		return result;
	}
}