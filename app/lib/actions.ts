"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";
import { awardTaskCompletionCoins, getActiveSessionSnapshot, insertTask, startTaskSession, stopTaskSession } from "@/app/lib/queries";
import type {
	AwardTaskCoinsResult,
	ActiveSessionSnapshot,
	CreateTaskState,
	StartTaskResult,
	StopTaskResult,
} from "@/app/lib/types";

function isValidDateInput(value: string) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number(value.slice(0, 4)) < 1) return false;
	const date = new Date(`${value}T00:00:00.000Z`);
	return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function createTask(
	_previousState: CreateTaskState,
	formData: FormData,
): Promise<CreateTaskState> {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return { message: "You must be signed in to create a task.", error: true };
	}

	const title = String(formData.get("title") ?? "").trim();
	const description = String(formData.get("description") ?? "").trim() || null;
	const targetMinutes = Number(formData.get("target_minutes"));
	const recurrenceType = formData.get("recurrence_type");
	const recurrenceStartDateInput = String(formData.get("recurrence_start_date") ?? "");

	if (!title || title.length === 0) {
		return { message: "Enter a task name.", error: true };
	}

	if (!Number.isInteger(targetMinutes) || targetMinutes <= 0) {
		return { message: "Target minutes must be a positive whole number.", error: true };
	}

	if (recurrenceType !== "once" && recurrenceType !== "recurring") {
		return { message: "Choose whether the task repeats.", error: true };
	}

	if (!isValidDateInput(recurrenceStartDateInput)) {
		return { message: "Choose a valid task date.", error: true };
	}

	let recurrenceInterval: number | null = null;
	let recurrenceUnit: string | null = null;

	if (recurrenceType === "recurring") {
		recurrenceInterval = Number(formData.get("recurrence_interval"));
		recurrenceUnit = String(formData.get("recurrence_unit") ?? "");

		if (!Number.isInteger(recurrenceInterval) || recurrenceInterval <= 0) {
			return { message: "Repeat interval must be a positive whole number.", error: true };
		}

		if (!["day", "week", "month"].includes(recurrenceUnit)) {
			return { message: "Choose a valid recurrence unit.", error: true };
		}
	}

	await insertTask({
		userId: session.user.id,
		title,
		description,
		targetMinutes,
		recurrenceType,
		recurrenceInterval,
		recurrenceUnit,
		recurrenceStartDate: recurrenceStartDateInput,
	});

	return { message: `Task "${title}" created.` };
}

export async function startTask(taskId: string): Promise<StartTaskResult> {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session?.user) {
		return { error: "You must be signed in to start a task." };
	}

	try {
		const result = await startTaskSession(session.user.id, taskId);
		const stoppedTaskCoinsAwarded = result.stoppedTaskId
			? await awardTaskCompletionCoins(session.user.id, result.stoppedTaskId).catch(() => 0)
			: 0;
		revalidatePath("/dashboard/home");
		revalidatePath("/dashboard/profile");
		return { ...result, stoppedTaskCoinsAwarded };
	} catch {
		return { error: "Could not start the task. Try again." };
	}
}

export async function stopTask(taskId: string): Promise<StopTaskResult> {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session?.user) {
		return { error: "You must be signed in to stop a task." };
	}

	try {
		const sessionSeconds = await stopTaskSession(session.user.id, taskId);
		const coinsAwarded = await awardTaskCompletionCoins(session.user.id, taskId).catch(() => 0);
		revalidatePath("/dashboard/home");
		revalidatePath("/dashboard/profile");
		return { sessionSeconds, coinsAwarded };
	} catch {
		return { error: "Could not stop the task. Try again." };
	}
}

export async function awardTaskCoins(taskId: string): Promise<AwardTaskCoinsResult> {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session?.user) {
		return { error: "You must be signed in to earn coins." };
	}

	try {
		const coinsAwarded = await awardTaskCompletionCoins(session.user.id, taskId);
		revalidatePath("/dashboard/profile");
		return { coinsAwarded };
	} catch {
		return { error: "Could not record the task reward. Try again." };
	}
}

export async function getActiveSession(): Promise<ActiveSessionSnapshot> {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session?.user) {
		return { taskId: null, startedAt: null };
	}

	return getActiveSessionSnapshot(session.user.id);
}
