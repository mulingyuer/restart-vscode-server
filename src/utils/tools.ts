/*
 * @Author: mulingyuer
 * @Date: 2026-03-29 15:37:39
 * @LastEditTime: 2026-03-29 17:44:05
 * @LastEditors: mulingyuer
 * @Description: 工具方法
 * @FilePath: \restart-vscode-server\src\utils\tools.ts
 * 怎么可能会有bug！！！
 */
import * as vscode from "vscode";
import { EXTENSION_NAMESPACE } from "@/constant/extension";

/** 判断插件是否启用并激活 */
export async function isExtensionEnabledAndActive(extensionId: string): Promise<boolean> {
	const extension = vscode.extensions.getExtension(extensionId);
	if (!extension) return false;

	if (!extension.isActive) {
		await extension.activate();
	}

	return extension.isActive;
}

/** 获取插件的配置 */
export function getExtensionConfiguration<T>(section: string, defaultValue: T): T | undefined {
	return vscode.workspace.getConfiguration(EXTENSION_NAMESPACE).get<T>(section, defaultValue);
}

/** 防抖 */
export function debounce<T extends (...args: any[]) => any>(
	fn: T,
	delay: number
): (...args: Parameters<T>) => void {
	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	return function (this: any, ...args: Parameters<T>) {
		if (timeoutId) clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			fn.apply(this, args);
		}, delay);
	};
}
