
export interface Permissions {
	version: number;
	permissions: {
		fs?: {
			rules: string[];
		},
		exec?: {
			rules: string[];
		},
		net?: {
			rules: string[];
		}
	}
}

export interface PermissionsModel {
	isExecAllowed(command: string, stackTrace: NodeJS.CallSite[]): boolean;
	isFileAccessAllowed(path: string, stackTrace: NodeJS.CallSite[]): boolean;
	isNetRequestAllowed(host: string, stackTrace: NodeJS.CallSite[]): boolean;
}

export interface ErrnoException extends Error {
	errno?: number | undefined;
	code?: string | undefined;
	path?: string | undefined;
	syscall?: string | undefined;
}

