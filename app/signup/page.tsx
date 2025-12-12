"use client"

import { useState } from "react"
import Image from "next/image"
import { LoginForm } from "@/components/auth/login-form"
import { SignupForm } from "@/components/auth/signup-form"

export default function SignupPage() {
  const [isLogin, setIsLogin] = useState(false) // Default to signup mode

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Image src="/logo.jpg" alt="QORSCEND Logo" width={200} height={80} className="object-contain" />
        </div>

        {/* Auth Form */}
        {isLogin ? (
          <LoginForm onToggleMode={() => setIsLogin(false)} />
        ) : (
          <SignupForm onToggleMode={() => setIsLogin(true)} />
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Professional quantum computing tools for developers</p>
          <p className="mt-1">QCode Convert • QBenchmark Live • QData Clean</p>
        </div>
      </div>
    </div>
  )
}

