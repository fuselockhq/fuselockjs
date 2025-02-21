export interface Permissions {
	version: number;
	permissions: {
		exec?: {
			allow?: string[];
		},
		http?: {
			allow?: string[];
			deny?: string[];
		}
	}
}

export interface PermissionsModel {
	isExecAllowed(command: string, packages: string[]): boolean;
	isHttpRequestAllowed(host: string, packages: string[]): boolean;
}

