import * as vscode from "vscode";
// 指令
import { createRestartTsServer } from "@/command/restart-ts-server";
// 状态栏按钮
import { RestartTsServerButton } from "@/status-bar/restart-ts-server";

/** 插件激活钩子 */
export function activate(context: vscode.ExtensionContext) {
	// 指令
	const restartTsServerDisposable = createRestartTsServer();
	context.subscriptions.push(restartTsServerDisposable);

	// 状态栏按钮
	const restartTsServerButton = new RestartTsServerButton();
	context.subscriptions.push(restartTsServerButton);
}

/** 插件卸载钩子 */
export function deactivate() {}
