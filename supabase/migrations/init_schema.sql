


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."delete_today_execution"("task_id_input" "uuid", "user_id_input" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  delete from task_executions e
  where e.task_id = task_id_input
    and e.user_id = user_id_input
    AND e.executed_at::date = now()::date;
end;
$$;


ALTER FUNCTION "public"."delete_today_execution"("task_id_input" "uuid", "user_id_input" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_progress_nightly"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  local_today date := (now() at time zone 'Asia/Seoul')::date;  -- KST 기준 "오늘"
BEGIN
  WITH calc AS (
    SELECT
      t.id                                                                                   AS task_id,
      -- 경과일(KST) 최소 1 보장
      GREATEST(1, (local_today - t.start_date + 1))::int                                     AS days_passed_new,

      -- [중요] 누적 방학일수: 각 방학과 [t.start_date ~ local_today]의 교집합 일수 합
      COALESCE((
        SELECT SUM(
                 GREATEST(
                   0,
                   (LEAST(local_today, v.end_date) - GREATEST(t.start_date, v.start_date) + 1)
                 )
               )
        FROM public.task_vacations v
        WHERE v.task_id = t.id
          AND v.start_date <= local_today
          AND v.end_date   >= t.start_date
      ), 0)::int                                                                             AS vacation_days_new,

      -- 실행 누적(널 방지)
      COALESCE(t.current_count, 0)::numeric                                                  AS current_count_new,

      t.target_count,
      t.interval_days,

      -- [상태 판정용] 오늘이 방학에 속하는지 여부
      EXISTS (
        SELECT 1
        FROM public.task_vacations v
        WHERE v.task_id = t.id
          AND v.start_date <= local_today
          AND v.end_date   >= local_today
      )            



    FROM public.tasks t
  )
  UPDATE public.tasks AS t
  SET
    days_passed    = c.days_passed_new,
    vacation_days  = c.vacation_days_new,

    -- [핵심] expected_count는 "방학 제외 일수"로 계산(분모 보정)
    expected_count = CASE
                       WHEN c.interval_days > 0
                         THEN (c.target_count::numeric
                               * (c.days_passed_new - c.vacation_days_new)::numeric)
                              / c.interval_days::numeric
                       ELSE 1::numeric
                     END,

    success_ratio  = CASE
                       WHEN (c.interval_days > 0)
                            AND (c.days_passed_new - c.vacation_days_new) > 0
                         THEN c.current_count_new
                              / ((c.target_count::numeric
                                  * (c.days_passed_new - c.vacation_days_new)::numeric)
                                 / c.interval_days::numeric)
                       ELSE 0
                     END,

    -- [상태값 갱신]
    status = CASE
               WHEN c.is_vacation_today THEN '방학중'
               ELSE '진행중'
             END
  FROM calc c
  WHERE t.id = c.task_id;
END;
$$;


ALTER FUNCTION "public"."refresh_progress_nightly"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_validate_task_vacation_insupd"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  local_today date := (now() at time zone 'Asia/Seoul')::date;
  last_end   date;
  overlap_ct int;
BEGIN
  -- 4-1) 시작일은 "내일" 이후만 허용 (오늘/과거 금지)
  IF NEW.start_date <= (local_today) THEN
    RAISE EXCEPTION 'start_date must be later than today (KST).';
  END IF;

  -- 4-2) 동일 task 내 기간 겹침 금지(자기 자신 제외)
  IF TG_OP = 'INSERT' THEN
  -- 겹침 검사 실행
  SELECT COUNT(*) INTO overlap_ct
  FROM public.task_vacations v
  WHERE v.task_id = NEW.task_id
    AND v.start_date <= NEW.end_date
    AND v.end_date   >= NEW.start_date;
  IF overlap_ct > 0 THEN
    RAISE EXCEPTION 'vacation dates overlap with existing records.';
  END IF;

ELSIF TG_OP = 'UPDATE' THEN
  -- 방학이 이미 시작된 경우만 차단
  IF local_today >= OLD.start_date THEN
    RAISE EXCEPTION 'cannot modify vacation after it has started.';
  END IF;
END IF;

  -- 4-3) 재신청 제한: 마지막 종료일 + 2개월 <= NEW.start_date
  SELECT MAX(v.end_date) INTO last_end
  FROM public.task_vacations v
  WHERE v.task_id = NEW.task_id
    AND v.end_date < NEW.start_date;
  IF last_end IS NOT NULL AND NEW.start_date < (last_end + INTERVAL '2 months')::date THEN
    RAISE EXCEPTION 're-apply is allowed only 2 months after the last vacation end.';
  END IF;

  -- 4-4) 업데이트의 경우: 시작일 전날 24시 이후에는 수정 금지
  IF TG_OP = 'UPDATE' THEN
    -- 방학이 이미 시작된 이후(= local_today >= OLD.start_date)에는 변경 금지
    IF local_today >= OLD.start_date THEN
      RAISE EXCEPTION 'cannot modify vacation after it has started.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trg_validate_task_vacation_insupd"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_task_on_execution"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_task_id UUID;
  v_current_count INTEGER;         -- 현재 실행 횟수
  v_expected_count numeric;
BEGIN
  -- task_id 식별
  IF TG_OP = 'INSERT' THEN        --이해안되는부분1
    v_task_id := NEW.task_id;
  ELSE
    v_task_id := OLD.task_id;
  END IF;

  -- ✅ 1) 최신 실행일 갱신
  IF TG_OP = 'INSERT' THEN
    UPDATE tasks
    SET last_check_date = NEW.executed_at
    WHERE tasks.id = v_task_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    UPDATE tasks
    SET last_check_date = (
      SELECT MAX(executed_at)
      FROM task_executions
      WHERE task_executions.task_id = v_task_id
    )
    WHERE tasks.id = v_task_id;
  END IF;

  -- ✅ 2) 현재 실행 횟수 계산
  SELECT COUNT(*) INTO v_current_count
  FROM task_executions
  WHERE task_executions.task_id = v_task_id;

  -- ✅ 3) expected_count 불러오기 (nightly job이 유지)
  SELECT expected_count INTO v_expected_count
  FROM public.tasks
  WHERE id = v_task_id;


  -- ✅ 4) current_count / success_ratio 갱신
  UPDATE public.tasks
  SET current_count = v_current_count,
      success_ratio = CASE
                        WHEN v_expected_count IS NULL OR v_expected_count = 0 THEN 0
                        ELSE v_current_count::numeric / v_expected_count
                      END
  WHERE id = v_task_id;

  -- 트리거 반환

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;


ALTER FUNCTION "public"."update_task_on_execution"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."task_executions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "executed_at" "date",
    "user_id" "uuid"
);


ALTER TABLE "public"."task_executions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_vacations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"(),
    CONSTRAINT "task_vacations_fixed_50d" CHECK ((("end_date" - "start_date") = 49))
);


ALTER TABLE "public"."task_vacations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT ''::"text",
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "interval_days" integer,
    "last_check_date" "date",
    "success_ratio" numeric,
    "alert_enabled" boolean DEFAULT false,
    "target_count" integer,
    "start_date" "date",
    "updated_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text"),
    "current_count" integer DEFAULT 0,
    "days_passed" integer DEFAULT 1,
    "expected_count" numeric DEFAULT 1,
    "vacation_days" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


ALTER TABLE ONLY "public"."task_executions"
    ADD CONSTRAINT "task_executions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_vacations"
    ADD CONSTRAINT "task_vacations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_executions"
    ADD CONSTRAINT "unique_task_execution_per_day" UNIQUE ("task_id", "executed_at");



CREATE INDEX "idx_task_vacations_range" ON "public"."task_vacations" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_task_vacations_task" ON "public"."task_vacations" USING "btree" ("task_id");



CREATE OR REPLACE TRIGGER "trg_task_vacations_validate" BEFORE INSERT OR UPDATE ON "public"."task_vacations" FOR EACH ROW EXECUTE FUNCTION "public"."trg_validate_task_vacation_insupd"();



CREATE OR REPLACE TRIGGER "trigger_set_updated_at" BEFORE UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_task_on_execution" AFTER INSERT ON "public"."task_executions" FOR EACH ROW EXECUTE FUNCTION "public"."update_task_on_execution"();



CREATE OR REPLACE TRIGGER "trigger_update_task_on_execution_delete" AFTER DELETE ON "public"."task_executions" FOR EACH ROW EXECUTE FUNCTION "public"."update_task_on_execution"();



ALTER TABLE ONLY "public"."task_executions"
    ADD CONSTRAINT "task_executions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_vacations"
    ADD CONSTRAINT "task_vacations_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;



CREATE POLICY "Users can DELETE own tasks" ON "public"."tasks" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can UPDATE own tasks" ON "public"."tasks" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own executions" ON "public"."task_executions" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own tasks" ON "public"."tasks" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own executions" ON "public"."task_executions" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can select own tasks" ON "public"."tasks" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."task_executions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_vacations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "task_vacations_delete_own" ON "public"."task_vacations" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "task_vacations_insert_own" ON "public"."task_vacations" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "task_vacations_select_own" ON "public"."task_vacations" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "task_vacations_update_own" ON "public"."task_vacations" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."delete_today_execution"("task_id_input" "uuid", "user_id_input" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_today_execution"("task_id_input" "uuid", "user_id_input" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_today_execution"("task_id_input" "uuid", "user_id_input" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_progress_nightly"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_progress_nightly"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_progress_nightly"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_validate_task_vacation_insupd"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_validate_task_vacation_insupd"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_validate_task_vacation_insupd"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_task_on_execution"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_task_on_execution"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_task_on_execution"() TO "service_role";



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;















GRANT ALL ON TABLE "public"."task_executions" TO "anon";
GRANT ALL ON TABLE "public"."task_executions" TO "authenticated";
GRANT ALL ON TABLE "public"."task_executions" TO "service_role";



GRANT ALL ON TABLE "public"."task_vacations" TO "anon";
GRANT ALL ON TABLE "public"."task_vacations" TO "authenticated";
GRANT ALL ON TABLE "public"."task_vacations" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































