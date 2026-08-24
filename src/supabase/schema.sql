-- ============================================================================
-- JLPT N1 Master — database schema
--
-- Notes:
--   * Content tables (vocabulary, kanji, reading_articles, ...) are public
--     read data curated by the platform — no RLS needed beyond "readable by
--     anyone", writable only by service role / admin tooling.
--   * Learning-state tables (user_vocabulary, reviews, mistakes, ...) are
--     strictly per-user: RLS restricts every row to auth.uid() = user_id.
--   * This file is additive/idempotent-ish for local dev; in production run
--     it through proper migrations (Supabase CLI `supabase migration new`).
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. Profiles (extends Supabase auth.users)
-- ----------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default 'Learner',
  current_level text not null default 'N2' check (current_level in ('N3', 'N2', 'N1', 'passed-N1')),
  goal text not null default 'aim-180' check (goal in ('pass-n1', 'score-120', 'score-150', 'aim-180', 'master-japanese')),
  target_test_date date,
  daily_study_minutes_target int not null default 30,
  daily_new_words_target int not null default 20,
  daily_review_target int not null default 80,
  interface_language text not null default 'en' check (interface_language in ('ja', 'en', 'vi')),
  translation_language text not null default 'en' check (translation_language in ('en', 'vi', 'none')),
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;
create policy "profiles: read own" on profiles for select using (auth.uid() = id);
create policy "profiles: update own" on profiles for update using (auth.uid() = id);
create policy "profiles: insert own" on profiles for insert with check (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- 2. Vocabulary content (public, service-role writable)
-- ----------------------------------------------------------------------------
create table if not exists vocabulary (
  id uuid primary key default uuid_generate_v4(),
  word text not null,
  reading text not null,
  hiragana text not null,
  romaji text not null,
  meaning_en text[] not null default '{}',
  meaning_vi text[] not null default '{}',
  definition_ja text not null default '',
  part_of_speech text[] not null default '{}',
  jlpt_level text not null check (jlpt_level in ('N5', 'N4', 'N3', 'N2', 'N1')),
  frequency_score int not null default 50 check (frequency_score between 0 and 100),
  difficulty int not null default 50 check (difficulty between 0 and 100),
  topics text[] not null default '{}',
  tags text[] not null default '{}',
  kanji text[] not null default '{}',
  audio_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_vocabulary_word on vocabulary (word);
create index if not exists idx_vocabulary_jlpt on vocabulary (jlpt_level);
create index if not exists idx_vocabulary_topics on vocabulary using gin (topics);

alter table vocabulary enable row level security;
create policy "vocabulary: readable by everyone" on vocabulary for select using (true);

create table if not exists vocabulary_examples (
  id uuid primary key default uuid_generate_v4(),
  vocabulary_id uuid not null references vocabulary (id) on delete cascade,
  japanese text not null,
  reading text,
  translation_en text not null,
  translation_vi text,
  register text
);
alter table vocabulary_examples enable row level security;
create policy "vocabulary_examples: readable by everyone" on vocabulary_examples for select using (true);

create table if not exists vocabulary_collocations (
  id uuid primary key default uuid_generate_v4(),
  vocabulary_id uuid not null references vocabulary (id) on delete cascade,
  phrase text not null,
  reading text,
  translation_en text not null
);
alter table vocabulary_collocations enable row level security;
create policy "vocabulary_collocations: readable by everyone" on vocabulary_collocations for select using (true);

-- Synonyms / antonyms / confusing / related words — all "relations" between two vocabulary rows.
create table if not exists vocabulary_relations (
  id uuid primary key default uuid_generate_v4(),
  vocabulary_id uuid not null references vocabulary (id) on delete cascade,
  related_vocabulary_id uuid not null references vocabulary (id) on delete cascade,
  relation text not null check (relation in ('synonym', 'antonym', 'related', 'confusing')),
  nuance text,
  unique (vocabulary_id, related_vocabulary_id, relation)
);
alter table vocabulary_relations enable row level security;
create policy "vocabulary_relations: readable by everyone" on vocabulary_relations for select using (true);

-- ----------------------------------------------------------------------------
-- 3. Kanji content
-- ----------------------------------------------------------------------------
create table if not exists kanji (
  id uuid primary key default uuid_generate_v4(),
  character text not null unique,
  meaning text[] not null default '{}',
  on_readings text[] not null default '{}',
  kun_readings text[] not null default '{}',
  radical text,
  stroke_count int,
  jlpt_level text check (jlpt_level in ('N5', 'N4', 'N3', 'N2', 'N1'))
);
alter table kanji enable row level security;
create policy "kanji: readable by everyone" on kanji for select using (true);

create table if not exists kanji_vocabulary (
  kanji_id uuid not null references kanji (id) on delete cascade,
  vocabulary_id uuid not null references vocabulary (id) on delete cascade,
  primary key (kanji_id, vocabulary_id)
);
alter table kanji_vocabulary enable row level security;
create policy "kanji_vocabulary: readable by everyone" on kanji_vocabulary for select using (true);

-- ----------------------------------------------------------------------------
-- 4. Per-user learning state
-- ----------------------------------------------------------------------------
create table if not exists user_vocabulary (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  vocabulary_id uuid not null references vocabulary (id) on delete cascade,
  status text not null default 'unseen' check (status in ('unseen', 'learning', 'young', 'mature', 'mastered')),
  mastery_level int not null default 0 check (mastery_level between 0 and 7),
  overall_mastery numeric not null default 0,
  reading_mastery numeric not null default 0,
  meaning_mastery numeric not null default 0,
  context_mastery numeric not null default 0,
  synonym_mastery numeric not null default 0,
  collocation_mastery numeric not null default 0,
  production_mastery numeric not null default 0,
  difficulty numeric not null default 5,
  stability numeric not null default 1,
  retrievability numeric not null default 1,
  review_count int not null default 0,
  correct_count int not null default 0,
  incorrect_count int not null default 0,
  lapse_count int not null default 0,
  bookmarked boolean not null default false,
  marked_difficult boolean not null default false,
  last_reviewed_at timestamptz,
  next_review_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, vocabulary_id)
);
create index if not exists idx_user_vocabulary_due on user_vocabulary (user_id, next_review_at);
create index if not exists idx_user_vocabulary_status on user_vocabulary (user_id, status);

alter table user_vocabulary enable row level security;
create policy "user_vocabulary: owner full access" on user_vocabulary
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 5. Quiz / review sessions
-- ----------------------------------------------------------------------------
create table if not exists questions (
  id uuid primary key default uuid_generate_v4(),
  vocabulary_id uuid references vocabulary (id) on delete cascade,
  question_type text not null check (
    question_type in ('reading', 'meaning', 'context', 'synonym', 'collocation', 'confusing-word', 'production')
  ),
  prompt text not null,
  context text,
  options jsonb not null default '[]',
  explanation text not null default ''
);
alter table questions enable row level security;
create policy "questions: readable by everyone" on questions for select using (true);

create table if not exists quiz_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mode text not null check (mode in ('learn', 'review', 'practice', 'mock')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  xp_earned int not null default 0
);
alter table quiz_sessions enable row level security;
create policy "quiz_sessions: owner full access" on quiz_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists quiz_answers (
  id uuid primary key default uuid_generate_v4(),
  quiz_session_id uuid not null references quiz_sessions (id) on delete cascade,
  question_id uuid references questions (id),
  vocabulary_id uuid references vocabulary (id),
  question_type text not null,
  selected_option_id text,
  correct boolean not null,
  response_time_ms int not null default 0,
  answered_at timestamptz not null default now()
);
alter table quiz_answers enable row level security;
create policy "quiz_answers: owner via session" on quiz_answers
  for all using (
    exists (select 1 from quiz_sessions qs where qs.id = quiz_session_id and qs.user_id = auth.uid())
  );

create table if not exists reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  vocabulary_id uuid not null references vocabulary (id) on delete cascade,
  grade text not null check (grade in ('again', 'hard', 'good', 'easy')),
  dimension text,
  reviewed_at timestamptz not null default now()
);
alter table reviews enable row level security;
create policy "reviews: owner full access" on reviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists review_answers (
  id uuid primary key default uuid_generate_v4(),
  review_id uuid not null references reviews (id) on delete cascade,
  correct boolean not null,
  response_time_ms int not null default 0
);
alter table review_answers enable row level security;
create policy "review_answers: owner via review" on review_answers
  for all using (
    exists (select 1 from reviews r where r.id = review_id and r.user_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- 6. Mistakes, daily activity/missions, weakness, score predictions
-- ----------------------------------------------------------------------------
create table if not exists mistakes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  vocabulary_id uuid not null references vocabulary (id) on delete cascade,
  question_type text not null,
  selected_answer text not null,
  correct_answer text not null,
  answered_at timestamptz not null default now(),
  response_time_ms int not null default 0,
  mistake_count int not null default 1
);
alter table mistakes enable row level security;
create policy "mistakes: owner full access" on mistakes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists daily_activity (
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  words_learned int not null default 0,
  reviews_completed int not null default 0,
  quiz_questions_answered int not null default 0,
  correct_answers int not null default 0,
  study_time_minutes numeric not null default 0,
  xp_earned int not null default 0,
  primary key (user_id, date)
);
alter table daily_activity enable row level security;
create policy "daily_activity: owner full access" on daily_activity
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists daily_missions (
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  new_words_target int not null default 20,
  new_words_done int not null default 0,
  reviews_target int not null default 80,
  reviews_done int not null default 0,
  synonym_questions_target int not null default 10,
  synonym_questions_done int not null default 0,
  collocation_questions_target int not null default 10,
  collocation_questions_done int not null default 0,
  reading_passages_target int not null default 1,
  reading_passages_done int not null default 0,
  listening_questions_target int not null default 10,
  listening_questions_done int not null default 0,
  xp_target int not null default 900,
  xp_earned int not null default 0,
  primary key (user_id, date)
);
alter table daily_missions enable row level security;
create policy "daily_missions: owner full access" on daily_missions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists weakness_scores (
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null,
  label text not null,
  score numeric not null default 0,
  classification text not null check (classification in ('critical', 'weak', 'improving', 'strong', 'mastered')),
  sample_size int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, category)
);
alter table weakness_scores enable row level security;
create policy "weakness_scores: owner full access" on weakness_scores
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists score_predictions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  language_knowledge numeric not null,
  reading numeric not null,
  listening numeric not null,
  total numeric not null,
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  generated_at timestamptz not null default now()
);
alter table score_predictions enable row level security;
create policy "score_predictions: owner full access" on score_predictions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 7. Reading / listening / mock tests (Phase 3 scaffolding)
-- ----------------------------------------------------------------------------
create table if not exists reading_articles (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  topic text,
  difficulty text not null check (difficulty in ('N3', 'N2', 'N1', 'N1+')),
  estimated_reading_minutes int not null default 5,
  body_ja text not null,
  created_at timestamptz not null default now()
);
alter table reading_articles enable row level security;
create policy "reading_articles: readable by everyone" on reading_articles for select using (true);

create table if not exists reading_questions (
  id uuid primary key default uuid_generate_v4(),
  article_id uuid not null references reading_articles (id) on delete cascade,
  prompt text not null,
  options jsonb not null default '[]',
  explanation text
);
alter table reading_questions enable row level security;
create policy "reading_questions: readable by everyone" on reading_questions for select using (true);

create table if not exists listening_contents (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  category text not null check (
    category in ('conversation', 'announcement', 'lecture', 'news', 'business', 'fast-japanese')
  ),
  difficulty text not null check (difficulty in ('N3', 'N2', 'N1', 'N1+')),
  audio_url text,
  transcript_ja text,
  questions jsonb not null default '[]'
);
alter table listening_contents enable row level security;
create policy "listening_contents: readable by everyone" on listening_contents for select using (true);

create table if not exists mock_tests (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  structure jsonb not null default '{}',
  created_at timestamptz not null default now()
);
alter table mock_tests enable row level security;
create policy "mock_tests: readable by everyone" on mock_tests for select using (true);

create table if not exists mock_test_attempts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mock_test_id uuid not null references mock_tests (id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  result jsonb
);
alter table mock_test_attempts enable row level security;
create policy "mock_test_attempts: owner full access" on mock_test_attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- updated_at trigger helper
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();
create trigger trg_vocabulary_updated_at before update on vocabulary
  for each row execute function set_updated_at();
create trigger trg_user_vocabulary_updated_at before update on user_vocabulary
  for each row execute function set_updated_at();
