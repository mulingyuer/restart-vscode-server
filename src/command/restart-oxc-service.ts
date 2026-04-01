/*
 * @Author: mulingyuer
 * @Date: 2026-04-01 00:00:00
 * @LastEditTime: 2026-04-01 00:00:00
 * @LastEditors: mulingyuer
 * @Description: 重启 OXC 服务命令
 * @FilePath: \restart-vscode-server\src\command\restart-oxc-service.ts
 * 怎么可能会有bug！！！！
 */
import * as vscode from "vscode";
import { isExtensionEnabledAndActive } from "@/utils/tools";
import { RESTART_OXC_SERVICE_COMMAND } from "@/constant/command";

/** OXC 插件 ID */
const OXC_EXTENSION_ID = "oxc.oxc-vscode";
/** OXC lint 重启命令 */
const OXC_RESTART_LINT_COMMAND = "oxc.restartServer";
/** OXC fmt 重启命令 */
const OXC_RESTART_FORMATTER_COMMAND = "oxc.restartServerFormatter";

export function createRestartOXCService() {
	const disposable = vscode.commands.registerCommand(RESTART_OXC_SERVICE_COMMAND, async () => {
		try {
			// 是否启用并激活 OXC 插件
			const isActive = await isExtensionEnabledAndActive(OXC_EXTENSION_ID);

			if (!isActive) {
				vscode.window.showErrorMessage(vscode.l10n.t("error.oxcExtensionNotActive"));
				return;
			}

			// 获取可用命令
			const availableCommands = new Set(await vscode.commands.getCommands(true));
			let successCount = 0;
			let executeError: unknown;

			// 先尝试重启 lint 服务
			if (availableCommands.has(OXC_RESTART_LINT_COMMAND)) {
				try {
					await vscode.commands.executeCommand(OXC_RESTART_LINT_COMMAND);
					successCount++;
				} catch (error) {
					executeError = executeError ?? error;
				}
			}

			// 再尝试重启 formatter 服务
			if (availableCommands.has(OXC_RESTART_FORMATTER_COMMAND)) {
				try {
					await vscode.commands.executeCommand(OXC_RESTART_FORMATTER_COMMAND);
					successCount++;
				} catch (error) {
					executeError = executeError ?? error;
				}
			}

			// 保障两个命令尽量都尝试后再统一走异常分支
			if (executeError) {
				throw executeError;
			}

			if (successCount > 0) {
				vscode.window.showInformationMessage(vscode.l10n.t("info.oxcServiceRestarted"));
			} else {
				vscode.window.showErrorMessage(vscode.l10n.t("error.oxcExtensionNotActive"));
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(vscode.l10n.t("error.oxcServiceRestartFailed", errorMessage));
		}
	});

	return disposable;
}
