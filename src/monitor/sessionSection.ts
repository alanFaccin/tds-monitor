import * as vscode from 'vscode';
import * as path from 'path';

export class SessionSection extends vscode.TreeItem {

	public username: string;
	public computerName: string;
	public threadId: number;
	public server: string;
	public mainName: string;
	public environment: string;
	public loginTime: string;
	public elapsedTime: string;
	public totalInstrCount: number;
	public instrCountPerSec: number;
	public obs: string;

	public memUsed: number;
	public sid: string;
	public ctreeTaskId: number;
	public clientType: string;
	public inactiveTime: string;

	constructor(
		public user: MntUser
	) {
		super(user.username);
		this.username = user.username;
		this.computerName = user.computerName;
		this.threadId = user.threadId;
		this.server = user.server;
		this.mainName = user.mainName;
		this.environment = user.environment;
		this.loginTime = user.loginTime;
		this.elapsedTime = user.elapsedTime;
		this.totalInstrCount = user.totalInstrCount;
		this.instrCountPerSec = user.instrCountPerSec;
		this.obs = user.remark;
		this.memUsed = user.memUsed;
		this.sid = user.sid;
		this.ctreeTaskId = user.ctreeTaskId;
		this.clientType = user.clientType;
		this.inactiveTime = user.inactiveTime;
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'environment.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'environment.svg')
	};

	contextValue = 'envSection';

	get tooltip(): string {
		return `ENV=${this.environment} | Time Elapsed=${this.elapsedTime}`;
	}

	get description(): string{
		return `ID=${this.threadId} | Main=${this.mainName}`;
	}
}