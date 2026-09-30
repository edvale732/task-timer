import { Pool } from "@neondatabase/serverless";
import type { ActiveSessionSnapshot, CalendarTask, CreateTaskInput, TodaysTask } from "@/app/lib/types";

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
});

export async function insertTask(task: CreateTaskInput): Promise<void> {
	await pool.query(
		`INSERT INTO "task" (
			"user_id",
			"title",
			"description",
			"target_minutes",
			"recurrence_type",
			"recurrence_interval",
			"recurrence_unit",
			"recurrence_start_date"
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		[
			task.userId,
			task.title,
			task.description,
			task.targetMinutes,
			task.recurrenceType,
			task.recurrenceInterval,
			task.recurrenceUnit,
			task.recurrenceStartDate,
		],
	);
}

export async function getTodaysTasks(userId: string): Promise<TodaysTask[]> {
	const result = await pool.query<{
		id: string;
		title: string;
		description: string | null;
		targetMinutes: number;
		recurrenceType: "once" | "recurring";
		recurrenceInterval: number | null;
		recurrenceUnit: "day" | "week" | "month" | null;
		recurrenceStartDate: string | Date;
		monthlyOverflowBehavior: "last_day_of_month" | "skip" | null;
		completedSeconds: number;
		runningTaskId: string | null;
		startedAt: string | null;
	}>(
		`SELECT
			t."id"::text AS "id",
			t."title" AS "title",
			t."description" AS "description",
			t."target_minutes" AS "targetMinutes",
			t."recurrence_type" AS "recurrenceType",
			t."recurrence_interval" AS "recurrenceInterval",
			t."recurrence_unit" AS "recurrenceUnit",
			t."recurrence_start_date" AS "recurrenceStartDate",
			t."monthly_overflow_behavior" AS "monthlyOverflowBehavior",
			COALESCE(SUM(CASE WHEN ts."started_at"::date = CURRENT_DATE THEN ts."duration_seconds" ELSE 0 END), 0)::integer AS "completedSeconds",
			MAX(CASE WHEN ts."duration_seconds" IS NULL THEN ts."task_id"::text END) AS "runningTaskId",
			MAX(CASE WHEN ts."duration_seconds" IS NULL AND ts."started_at"::date = CURRENT_DATE THEN ts."started_at" END) AS "startedAt"
		FROM "task" t
		LEFT JOIN "task_session" ts
			ON ts."task_id" = t."id"
			AND ts."user_id" = t."user_id"
		WHERE t."user_id" = $1
			AND t."is_archived" = false
			AND (
				(t."recurrence_type" = 'once' AND t."recurrence_start_date" = CURRENT_DATE)
				OR (
					t."recurrence_type" = 'recurring'
					AND t."recurrence_start_date" <= CURRENT_DATE
					AND (
						(t."recurrence_unit" = 'day' AND MOD(CURRENT_DATE - t."recurrence_start_date", t."recurrence_interval") = 0)
						OR (t."recurrence_unit" = 'week' AND MOD(CURRENT_DATE - t."recurrence_start_date", t."recurrence_interval" * 7) = 0)
						OR (
							t."recurrence_unit" = 'month'
							AND MOD(((DATE_PART('year', CURRENT_DATE) - DATE_PART('year', t."recurrence_start_date")) * 12 + DATE_PART('month', CURRENT_DATE) - DATE_PART('month', t."recurrence_start_date"))::integer, t."recurrence_interval") = 0
							AND (
								DATE_PART('day', CURRENT_DATE) = DATE_PART('day', t."recurrence_start_date")
								OR (
									t."monthly_overflow_behavior" = 'last_day_of_month'
									AND DATE_PART('day', CURRENT_DATE) = DATE_PART('day', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')
									AND DATE_PART('day', t."recurrence_start_date") > DATE_PART('day', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')
								)
							)
						)
					)
				)
			)
		GROUP BY t."id", t."title", t."description", t."target_minutes", t."recurrence_type", t."recurrence_interval", t."recurrence_unit", t."recurrence_start_date", t."monthly_overflow_behavior"
		ORDER BY t."created_at", t."id"`,
		[userId],
	);

	return result.rows.map((task) => ({
		id: task.id,
		title: task.title,
		description: task.description,
		targetMinutes: task.targetMinutes,
		recurrenceType: task.recurrenceType,
		recurrenceInterval: task.recurrenceInterval,
		recurrenceUnit: task.recurrenceUnit,
		recurrenceStartDate: task.recurrenceStartDate instanceof Date
			? task.recurrenceStartDate.toISOString().slice(0, 10)
			: task.recurrenceStartDate,
		monthlyOverflowBehavior: task.monthlyOverflowBehavior,
		completedSeconds: Number(task.completedSeconds),
		isRunning: task.runningTaskId !== null,
		startedAt: task.runningTaskId !== null ? new Date(task.startedAt as string).toISOString() : null,
	}));
}

export async function getActiveSessionSnapshot(userId: string): Promise<ActiveSessionSnapshot> {
	const result = await pool.query<{ taskId: string; startedAt: string | null }>(
		`SELECT "task_id"::text AS "taskId",
			CASE WHEN "started_at"::date = CURRENT_DATE THEN "started_at" END AS "startedAt"
		FROM "task_session"
		WHERE "user_id" = $1 AND "duration_seconds" IS NULL
		LIMIT 1`,
		[userId],
	);

	const row = result.rows[0];
	return row
		? { taskId: row.taskId, startedAt: row.startedAt ? new Date(row.startedAt).toISOString() : null }
		: { taskId: null, startedAt: null };
}

export async function getTotalFocusedSeconds(userId: string): Promise<number> {
	const result = await pool.query<{ totalFocusedSeconds: number | string }>(
		`SELECT COALESCE(
			SUM(COALESCE(
				"duration_seconds",
				GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - "started_at"))))::integer
			)),
			0
		)::bigint AS "totalFocusedSeconds"
		FROM "task_session"
		WHERE "user_id" = $1`,
		[userId],
	);

	return Number(result.rows[0]?.totalFocusedSeconds ?? 0);
}

export type StartedSession = {
	startedAt: string;
	stoppedTaskId: string | null;
	stoppedSessionSeconds: number | null;
};

export async function startTaskSession(userId: string, taskId: string): Promise<StartedSession> {
	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		const stopped = await client.query<{ taskId: string; durationSeconds: number }>(
			`UPDATE "task_session"
			SET "ended_at" = NOW(), "duration_seconds" = GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - "started_at"))))::integer
			WHERE "user_id" = $1 AND "duration_seconds" IS NULL
			RETURNING "task_id"::text AS "taskId",
				CASE WHEN "started_at"::date = CURRENT_DATE THEN "duration_seconds" ELSE 0 END AS "durationSeconds"`,
			[userId],
		);

		const inserted = await client.query<{ startedAt: string }>(
			`INSERT INTO "task_session" ("task_id", "user_id", "started_at")
			VALUES ($1, $2, NOW())
			RETURNING "started_at" AS "startedAt"`,
			[taskId, userId],
		);

		await client.query("COMMIT");

		const stoppedRow = stopped.rows[0];

		return {
			startedAt: new Date(inserted.rows[0].startedAt).toISOString(),
			stoppedTaskId: stoppedRow ? stoppedRow.taskId : null,
			stoppedSessionSeconds: stoppedRow ? Number(stoppedRow.durationSeconds) : null,
		};
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
}

export async function stopTaskSession(userId: string, taskId: string): Promise<number> {
	const result = await pool.query<{ durationSeconds: number }>(
		`UPDATE "task_session"
		SET "ended_at" = NOW(), "duration_seconds" = GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - "started_at"))))::integer
		WHERE "task_id" = $1 AND "user_id" = $2 AND "duration_seconds" IS NULL
		RETURNING CASE WHEN "started_at"::date = CURRENT_DATE THEN "duration_seconds" ELSE 0 END AS "durationSeconds"`,
		[taskId, userId],
	);

	if (result.rows.length === 0) {
		throw new Error("No running session found for this task.");
	}

	return Number(result.rows[0].durationSeconds);
}

export async function getCalendarTasks(userId: string): Promise<CalendarTask[]> {
	const result = await pool.query<CalendarTask>(
		`SELECT
			t."id"::text AS "id",
			t."title" AS "title",
			t."recurrence_type" AS "recurrenceType",
			t."recurrence_interval" AS "recurrenceInterval",
			t."recurrence_unit" AS "recurrenceUnit",
			t."recurrence_start_date"::text AS "recurrenceStartDate",
			t."monthly_overflow_behavior" AS "monthlyOverflowBehavior"
		FROM "task" t
		WHERE t."user_id" = $1 AND t."is_archived" = false
		ORDER BY t."created_at", t."id"`,
		[userId],
	);

	return result.rows;
}