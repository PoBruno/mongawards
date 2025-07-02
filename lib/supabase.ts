import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  /**
   * Fail fast with an explicit message so the developer knows exactly
   * which env vars have to be set in the Vercel / local environment.
   */
  throw new Error(
    [
      "Missing Supabase credentials.",
      "Make sure to set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY ",
      "in your environment (e.g. Vercel project settings or `.env.local`).",
    ].join("\n"),
  )
}

/**
 * One single, shared Supabase client for the whole app.
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

export type User = {
  id: string
  email: string
  is_admin: boolean
  created_at: string
}

export type Category = {
  id: string
  name: string
  description: string
  banner_image?: string
  is_active: boolean
  voting_open: boolean // Legacy field for compatibility
  voting_phase: number // 1 or 2
  phase_1_active: boolean
  phase_2_active: boolean
  is_finalized: boolean
  created_at: string
}

export type Nominee = {
  id: string
  name: string
  description: string
  image?: string
  is_active: boolean
  vote_count: number // Legacy field for compatibility
  created_at: string
}

export type UserVote = {
  id: string
  user_id: string
  category_id: string
  created_at: string
}

export type IndividualVote = {
  id: string
  user_id: string
  nominee_id: string
  category_id: string
  created_at: string
}

export type Phase1Vote = {
  id: string
  user_id: string
  nominee_id: string
  category_id: string
  created_at: string
}

export type Phase2Vote = {
  id: string
  user_id: string
  nominee_id: string
  category_id: string
  created_at: string
}

export type UserVotingProgress = {
  id: string
  user_id: string
  category_id: string
  phase: number
  votes_cast: number
  max_votes: number
  created_at: string
  updated_at: string
}

export type NomineeCategory = {
  id: string
  nominee_id: string
  category_id: string
  created_at: string
}

export type NomineeWithCategories = Nominee & {
  categories?: Category[]
}

export type CategoryWithNominees = Category & {
  nominees?: Nominee[]
}

export type NomineeWithVotes = Nominee & {
  phase_1_votes: number
  phase_2_votes: number
}

export type PhaseResult = {
  nominee_id: string
  nominee_name: string
  vote_count: number
}
