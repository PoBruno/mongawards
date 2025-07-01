"use client"

import { useState, useEffect } from "react"
import AuthForm from "@/components/auth-form"
import SetupNotice from "@/components/setup-notice"
import { supabase } from "@/lib/supabase"

export default function Home() {
  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null)

  useEffect(() => {
    checkSetup()
  }, [])

  const checkSetup = async () => {
    try {
      // Try to query a table to see if setup is complete
      const { data, error } = await supabase.from("categories").select("id").limit(1)

      if (error) {
        console.log("Setup not complete:", error.message)
        setIsSetupComplete(false)
      } else {
        setIsSetupComplete(true)
      }
    } catch (error) {
      console.log("Setup check failed:", error)
      setIsSetupComplete(false)
    }
  }

  if (isSetupComplete === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-amber-700">Verificando configuração...</p>
        </div>
      </div>
    )
  }

  if (!isSetupComplete) {
    return <SetupNotice />
  }

  return <AuthForm />
}
