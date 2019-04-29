export interface ServerConfiguration {
	id: string;
	token: string;
	name: string;
	environments: string[];
	isConnected: boolean;

	//última conexão
	environment: string;
	username: string;
}