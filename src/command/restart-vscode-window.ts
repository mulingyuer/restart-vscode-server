/*
 * @Author: mulingyuer
 * @Date: 2026-04-01 00:00:00
 * @LastEditTime: 2026-04-01 00:00:00
 * @LastEditors: mulingyuer
 * @Description: 重启 VS Code 窗口命令
 * @FilePath: \restart-vscode-server\src\command\restart-vscode-window.ts
 * 怎么可能会有bug！！！
 */
import * as vscode from "vscode";
import { RESTART_VSCODE_WINDOW_COMMAND } from "@/constant/command";

export function createRestartVscodeWindow() {
	const disposable = vscode.commands.registerCommand(RESTART_VSCODE_WINDOW_COMMAND, async () => {
		try {
			await vscode.commands.executeCommand("workbench.action.reloadWindow");
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(vscode.l10n.t("error.vscodeWindowRestartFailed", errorMessage));
		}
	});

	return disposable;
}
