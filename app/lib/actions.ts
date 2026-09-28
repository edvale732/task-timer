"use server";

import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";
import { insertTask } from "@/app/lib/queries";
import type { CreateTaskState } from "@/app/lib/types";

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

	const recurrenceStartDate = recurrenceType === "once"
		? new Date().toISOString().slice(0, 10)
		: recurrenceStartDateInput;

	if (recurrenceType === "recurring" && !/^\d{4}-\d{2}-\d{2}$/.test(recurrenceStartDate)) {
		return { message: "Choose a recurrence start date.", error: true };
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
		recurrenceStartDate,
	});

	return { message: `Task "${title}" created.` };
}
