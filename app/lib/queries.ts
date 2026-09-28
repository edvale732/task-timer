import { Pool } from "@neondatabase/serverless";
import type { CreateTaskInput, TodaysTask } from "@/app/lib/types";

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
	const result = await pool.query<TodaysTask>(
		`SELECT
			t."id"::text AS "id",
			t."title" AS "title",
			t."target_minutes" AS "targetMinutes",
			COALESCE(SUM(
				COALESCE(
					ts."duration_seconds",
					GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - ts."started_at"))))::integer
				)
			), 0)::integer AS "spentSeconds"
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
		GROUP BY t."id", t."title", t."target_minutes", t."recurrence_start_date"
		ORDER BY t."created_at", t."id"`,
		[userId],
	);

	return result.rows.map((task) => ({
		...task,
		spentSeconds: Number(task.spentSeconds),
	}));
}