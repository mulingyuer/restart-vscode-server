/*
 * @Author: mulingyuer
 * @Date: 2026-03-31 00:00:00
 * @LastEditTime: 2026-04-02 20:27:26
 * @LastEditors: mulingyuer
 * @Description: 重启 Vue 服务命令
 * @FilePath: \restart-vscode-server\src\command\restart-vue-service.ts
 * 怎么可能会有bug！！！
 */
import * as vscode from "vscode";
import { isExtensionEnabledAndActive } from "@/utils/tools";
import { RESTART_VUE_SERVICE_COMMAND } from "@/constant/command";

/** Volar 插件 ID（新版，官方推荐） */
const VOLAR_EXTENSION_ID = "vue.volar";
/** Vetur 插件 ID（旧版） */
const VETUR_EXTENSION_ID = "octref.vetur";
/** Volar 在不同版本中可能使用不同的命令 ID */
const VOLAR_RESTART_COMMANDS = ["vue.action.restartServer", "volar.action.restartServer"];
/** Vetur 重启命令 */
const VETUR_RESTART_COMMAND = "vetur.restartVLS";

async function executeFirstAvailableCommand(commandIds: string[]): Promise<boolean> {
	const availableCommands = new Set(await vscode.commands.getCommands(true));

	for (const commandId of commandIds) {
		if (availableCommands.has(commandId)) {
			await vscode.commands.executeCommand(commandId);
			return true;
		}
	}

	return false;
}

export function createRestartVueService() {
	const disposable = vscode.commands.registerCommand(RESTART_VUE_SERVICE_COMMAND, async () => {
		try {
			// 是否有激活的插件
			let hasActiveExtension = false;

			// 优先检测 Volar（新版官方推荐）
			const isVolarActive = await isExtensionEnabledAndActive(VOLAR_EXTENSION_ID);
			if (isVolarActive) {
				hasActiveExtension = true;
				const restarted = await executeFirstAvailableCommand(VOLAR_RESTART_COMMANDS);
				if (restarted) {
					vscode.window.showInformationMessage(vscode.l10n.t("info.vueServiceRestarted"));
					return;
				}
			}

			// 其次检测 Vetur（旧版）
			const isVeturActive = await isExtensionEnabledAndActive(VETUR_EXTENSION_ID);
			if (isVeturActive) {
				hasActiveExtension = true;
				const restarted = await executeFirstAvailableCommand([VETUR_RESTART_COMMAND]);
				if (restarted) {
					vscode.window.showInformationMessage(vscode.l10n.t("info.vueServiceRestarted"));
					return;
				}
			}

			if (hasActiveExtension) {
				// 插件已激活但未找到可用的重启命令
				vscode.window.showErrorMessage(vscode.l10n.t("error.vueRestartCommandNotFound"));
			} else {
				// 两个插件都未安装/未激活
				vscode.window.showErrorMessage(vscode.l10n.t("error.vueExtensionNotActive"));
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(vscode.l10n.t("error.vueServiceRestartFailed", errorMessage));
		}
	});

	return disposable;
}
