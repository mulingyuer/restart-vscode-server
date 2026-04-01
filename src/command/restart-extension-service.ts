/*
 * @Author: mulingyuer
 * @Date: 2026-04-01 00:00:00
 * @LastEditTime: 2026-04-01 00:00:00
 * @LastEditors: mulingyuer
 * @Description: 重启插件服务命令
 * @FilePath: \restart-vscode-server\src\command\restart-extension-service.ts
 * 怎么可能会有bug！！！
 */
import * as vscode from "vscode";
import { RESTART_EXTENSION_SERVICE_COMMAND } from "@/constant/command";

export function createRestartExtensionService() {
	const disposable = vscode.commands.registerCommand(RESTART_EXTENSION_SERVICE_COMMAND, async () => {
		try {
			await vscode.commands.executeCommand("workbench.action.restartExtensionHost");
			vscode.window.showInformationMessage(vscode.l10n.t("info.extensionServiceRestarted"));
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(
				vscode.l10n.t("error.extensionServiceRestartFailed", errorMessage)
			);
		}
	});

	return disposable;
}
