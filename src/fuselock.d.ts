export interface Permissions {
	version: number;
	permissions: {
		exec?: {
			allow?: string[];
		},
		function?: {
			allow: boolean
		},
		http?: {
			allow?: string[];
			deny?: string[];
		},
		https?: {
			allow?: string[];
			deny?: string[];
		}
	}
}

export interface PermissionsModel {
	isExecAllowed(command: string, packages: string[]): boolean;
	isHttpRequestAllowed(host: string, packages: string[]): boolean;
	isFunctionConstructorAllowed(packages: string[]): boolean;
}

