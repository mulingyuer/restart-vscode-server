/*
 * @Author: mulingyuer
 * @Date: 2026-03-29 15:22:23
 * @LastEditTime: 2026-03-29 16:14:50
 * @LastEditors: mulingyuer
 * @Description: 重启 TypeScript 服务命令
 * @FilePath: \restart-vscode-server\src\command\restart-ts-server.ts
 * 怎么可能会有bug！！！
 */
import * as vscode from "vscode";
import { isExtensionEnabledAndActive } from "@/utils/tools";
import { RESTART_TS_SERVER_COMMAND } from "@/constant/command";

/** TypeScript 服务ID */
const TS_SERVER_ID = "vscode.typescript-language-features";

export function createRestartTsServer() {
	const disposable = vscode.commands.registerCommand(RESTART_TS_SERVER_COMMAND, async () => {
		// 是否启用并激活 TypeScript 插件
		const isActive = await isExtensionEnabledAndActive(TS_SERVER_ID);

		if (!isActive) {
			vscode.window.showErrorMessage("TypeScript 插件未启用或未激活，请先启用并激活该插件");
			return;
		}

		// 执行重启 TypeScript 服务的命令
		await vscode.commands.executeCommand("typescript.restartTsServer");

		vscode.window.showInformationMessage("TypeScript 服务已重启");
	});

	return disposable;
}
