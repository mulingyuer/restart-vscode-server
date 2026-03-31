/*
 * @Author: mulingyuer
 * @Date: 2026-03-31 00:00:00
 * @LastEditTime: 2026-03-31 00:00:00
 * @LastEditors: mulingyuer
 * @Description: 重启 ESLint 服务命令
 * @FilePath: \restart-vscode-server\src\command\restart-eslint-service.ts
 * 怎么可能会有bug！！！
 */
import * as vscode from "vscode";
import { isExtensionEnabledAndActive } from "@/utils/tools";
import { RESTART_ESLINT_SERVICE_COMMAND } from "@/constant/command";

/** ESLint 插件 ID */
const ESLINT_EXTENSION_ID = "dbaeumer.vscode-eslint";

export function createRestartESLintService() {
	const disposable = vscode.commands.registerCommand(RESTART_ESLINT_SERVICE_COMMAND, async () => {
		try {
			// 是否启用并激活 ESLint 插件
			const isActive = await isExtensionEnabledAndActive(ESLINT_EXTENSION_ID);

			if (!isActive) {
				vscode.window.showErrorMessage(vscode.l10n.t("error.eslintExtensionNotActive"));
				return;
			}

			// 执行重启 ESLint 服务的命令
			await vscode.commands.executeCommand("eslint.restart");

			vscode.window.showInformationMessage(vscode.l10n.t("info.eslintServiceRestarted"));
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(vscode.l10n.t("error.eslintServiceRestartFailed", errorMessage));
		}
	});

	return disposable;
}
