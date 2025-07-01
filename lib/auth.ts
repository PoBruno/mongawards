"use client"

import { supabase } from "./supabase"

export const signUp = async (email: string, password: string, secretCode: string) => {
  try {
    // Check if secret code exists and is not used
    const { data: codeData, error: codeError } = await supabase
      .from("secret_codes")
      .select("*")
      .eq("code", secretCode)
      .eq("is_used", false)
      .single()

    if (codeError || !codeData) {
      throw new Error("Código secreto inválido ou já utilizado")
    }

    // Check if user already exists
    const { data: existingUser } = await supabase.from("users").select("*").eq("email", email).single()

    if (existingUser) {
      throw new Error("Usuário já existe")
    }

    // Create user (password stored as plain text for demo - in production use proper hashing)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert([{ email, password, is_admin: false }])
      .select()
      .single()

    if (userError) {
      throw new Error("Erro ao criar usuário: " + userError.message)
    }

    // Mark secret code as used
    await supabase.from("secret_codes").update({ is_used: true, used_by: userData.id }).eq("id", codeData.id)

    return { user: userData, error: null }
  } catch (error) {
    return { user: null, error: error.message }
  }
}

export const signIn = async (email: string, password: string) => {
  try {
    // Check for admin credentials from environment variables
    const adminEmail = process.env.NEXT_PUBLIC_USER_ADMIN
    const adminPassword = process.env.NEXT_PUBLIC_USER_PASSWORD

    if (adminEmail && adminPassword && email === adminEmail && password === adminPassword) {
      const adminUser = {
        id: "admin-env-id",
        email: adminEmail,
        is_admin: true,
        created_at: new Date().toISOString(),
      }
      return { user: adminUser, error: null }
    }

    // Check regular users in database
    const { data: userData, error: userError } = await supabase.from("users").select("*").eq("email", email).single()

    if (userError || !userData) {
      throw new Error("Email ou senha incorretos")
    }

    if (userData.password !== password) {
      throw new Error("Email ou senha incorretos")
    }

    return { user: userData, error: null }
  } catch (error) {
    return { user: null, error: error.message }
  }
}
