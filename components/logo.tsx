"use client"

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  showText?: boolean
  className?: string
}

export function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: "text-lg" },
    md: { icon: 32, text: "text-xl" },
    lg: { icon: 40, text: "text-2xl" },
    xl: { icon: 56, text: "text-3xl" }
  }

  const { icon, text } = sizes[size]

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg 
        width={icon} 
        height={icon} 
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Background Circle with Gradient */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
        </defs>
        
        {/* Main Circle */}
        <circle cx="24" cy="24" r="22" fill="url(#logoGradient)" />
        
        {/* Inner Design - Stylized S with connection dots */}
        <path 
          d="M16 18C16 18 18 14 24 14C30 14 32 18 32 20C32 24 28 26 24 26C20 26 16 28 16 32C16 36 20 38 24 38C30 38 32 34 32 34" 
          stroke="white" 
          strokeWidth="3" 
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Connection Nodes */}
        <circle cx="16" cy="18" r="3" fill="white" />
        <circle cx="32" cy="34" r="3" fill="white" />
        
        {/* Center Dot */}
        <circle cx="24" cy="26" r="2" fill="url(#accentGradient)" />
        
        {/* Shine Effect */}
        <ellipse cx="18" cy="16" rx="4" ry="2" fill="white" opacity="0.3" transform="rotate(-30 18 16)" />
      </svg>
      
      {showText && (
        <span className={`font-bold ${text} bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent`}>
          SAJI
        </span>
      )}
    </div>
  )
}

export function LogoMark({ size = 32, className = "" }: { size?: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logoMarkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      
      <circle cx="24" cy="24" r="22" fill="url(#logoMarkGradient)" />
      
      <path 
        d="M16 18C16 18 18 14 24 14C30 14 32 18 32 20C32 24 28 26 24 26C20 26 16 28 16 32C16 36 20 38 24 38C30 38 32 34 32 34" 
        stroke="white" 
        strokeWidth="3" 
        strokeLinecap="round"
        fill="none"
      />
      
      <circle cx="16" cy="18" r="3" fill="white" />
      <circle cx="32" cy="34" r="3" fill="white" />
      <circle cx="24" cy="26" r="2" fill="#60A5FA" />
      <ellipse cx="18" cy="16" rx="4" ry="2" fill="white" opacity="0.3" transform="rotate(-30 18 16)" />
    </svg>
  )
}
