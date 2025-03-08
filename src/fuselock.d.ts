export interface Permissions {
	version: number;
	permissions: {
		fs?: {
			allow?: string[];
			deny?: string[];
		},
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
	isExecAllowed(command: string, stackTrace: NodeJS.CallSite[]): boolean;
	isFileAccessAllowed(path: string, stackTrace: NodeJS.CallSite[]): boolean;
	isHttpRequestAllowed(host: string, stackTrace: NodeJS.CallSite[]): boolean;
}

