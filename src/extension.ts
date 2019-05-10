/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

'use strict';
import { extensions, ExtensionContext, Uri } from 'vscode';
import { MonitorsExplorer, connectMonitor, disconnectMonitor } from './monitorsView';
import { getLanguageClient } from './TotvsLanguageClient';
import { LanguageClient } from 'vscode-languageclient';
import * as nls from 'vscode-nls';
import * as vscode from 'vscode';
import { MonitorItem } from './monitor/monitorItem';

export let languageClient: LanguageClient;
let localize = nls.config({ locale: 'en' })();

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

	//Register commands
	//Comando de conexão ao monitor
	context.subscriptions.push(vscode.commands.registerCommand('totvs-monitor.connect', (monitorItem) => connectMonitor(monitorItem, context)));
	//Comando de desconexão do monitor
	context.subscriptions.push(vscode.commands.registerCommand('totvs-monitor.disconnect', (serverItem: MonitorItem) => disconnectMonitor(serverItem)));

	//View
	let viewMonitor = new MonitorsExplorer(context);
	if (!viewMonitor) {
		console.error(localize('tds.vscode.monitor_vision_not_load', 'Visão "Monitor" não incializada.'));
	}

}