/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

'use strict';
import * as vscode from 'vscode';
//import * as Net from 'net';
//import * as ls from 'vscode-languageserver-types';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { commands, extensions, workspace, ExtensionContext, Uri } from 'vscode';

//import { jumpToUriAtPosition } from './vscodeUtils';
//import {CqueryErrorHandler} from './cqueryErrorHandler';
import { MonitorsExplorer} from './monitorsView';
import { getLanguageClient } from './TotvsLanguageClient';
//import Utils, { SelectServer } from './utils';
import welcomePage from './welcome/welcomePage';
import { LanguageClient } from 'vscode-languageclient';
import { inputConnectionParameters } from './inputConnectionParameters';
import * as nls from 'vscode-nls';

export let languageClient: LanguageClient;
let localize = nls.config({ locale: 'en' })();

/*
 * Set the following compile time flag to true if the
 * debug adapter should run inside the extension host.
 * Please note: the test suite does no longer work in this mode.
 */
//const EMBED_DEBUG_ADAPTER = false;

// barra de status
let totvsStatusBarItem: vscode.StatusBarItem;

export function parseUri(u): Uri {
	return Uri.parse(u);
}

export function activate(context: ExtensionContext) {

	console.log(localize('tds.console.congratulations', 'Congratulations, your extension "totvs-monior" is now active!'));

	//Load Language Client and start Language Server
	let ext = extensions.getExtension("TOTVS.totvs-monitor");
	if (ext) {
		languageClient = getLanguageClient(context);
		context.subscriptions.push(languageClient.start());
	}

	//Inicia o arquivo de servidores limpo.
	//Utils.clearConnectedServerConfig();

	//View
	let viewMonitor = new MonitorsExplorer(context);
	if (!viewMonitor) {
		console.error(localize('tds.vscode.monitor_vision_not_load', 'Visão "Monitor" não incializada.'));
	}

	//Welcome Page. Forca a pagina a ser aberta
	context.subscriptions.push(commands.registerCommand('totvs-monitor.welcomePage', () => showWelcomePage(context, true)));

	//Mostra a pagina de Welcome se a configuracao estiver true. Nao forca a exibicao
	showWelcomePage(context, false);

	//Authenticate command
	context.subscriptions.push(commands.registerCommand('totvs-monitor.serverAuthentication', (...args) => {
		if (args && args.length > 0) {
			inputConnectionParameters(context, args[0]);
		} else {
			inputConnectionParameters(context, undefined);
		}
	}));

	//inicialliza item de barra de status TOTVS
	totvsStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	totvsStatusBarItem.command = 'totvs-monitor.serverAuthentication';
	context.subscriptions.push(totvsStatusBarItem);
	//context.subscriptions.push(Utils.onDidSelectedServer(updateStatusBarItem));

	//updateIdentityBarItem(Utils.getIdentityInfos());
}

function showWelcomePage(context: ExtensionContext, forcedShow: boolean) {
	const configADVPL = workspace.getConfiguration('totvsLanguageServer');//transformar em configuracao de workspace
	let isShowWelcomePage = configADVPL.get('welcomePage');

	if (isShowWelcomePage || forcedShow) {
		welcomePage.show(context, forcedShow);
		isShowWelcomePage = configADVPL.update("welcomePage", false);
	}
}

// this method is called when your extension is deactivated
export function deactivate() {
	//Utils.deleteSelectServer();
}
