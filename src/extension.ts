import * as vscode from "vscode";
// 指令
import { createRestartTsServer } from "@/command/restart-ts-server";
import { createRestartESLintService } from "@/command/restart-eslint-service";
import { createRestartVueService } from "@/command/restart-vue-service";
// 状态栏按钮
import { RestartTsServerButton } from "@/status-bar/restart-ts-server";
import { RestartESLintServiceButton } from "@/status-bar/restart-eslint-service";
import { RestartVueServiceButton } from "@/status-bar/restart-vue-service";

/** 插件激活钩子 */
export function activate(context: vscode.ExtensionContext) {
	// 指令
	const restartTsServerDisposable = createRestartTsServer();
	context.subscriptions.push(restartTsServerDisposable);

	const restartESLintServiceDisposable = createRestartESLintService();
	context.subscriptions.push(restartESLintServiceDisposable);

	const restartVueServiceDisposable = createRestartVueService();
	context.subscriptions.push(restartVueServiceDisposable);

	// 状态栏按钮
	const restartTsServerButton = new RestartTsServerButton();
	context.subscriptions.push(restartTsServerButton);

	const restartESLintServiceButton = new RestartESLintServiceButton();
	context.subscriptions.push(restartESLintServiceButton);

	const restartVueServiceButton = new RestartVueServiceButton();
	context.subscriptions.push(restartVueServiceButton);
}

/** 插件卸载钩子 */
export function deactivate() {}
