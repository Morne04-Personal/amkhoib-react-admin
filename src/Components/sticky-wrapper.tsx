"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"

interface StickyWrapperProps {
  children: React.ReactNode
  className?: string
}

export const StickyWrapper: React.FC<StickyWrapperProps> = ({ children, className = "" }) => {
  const [height, setHeight] = useState<number>(0)
  const [width, setWidth] = useState<number>(0)
  const [isFixed, setIsFixed] = useState<boolean>(false)
  const ref = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      setHeight(ref.current.offsetHeight)
      setWidth(ref.current.offsetWidth)
    }

    const handleScroll = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setIsFixed(rect.top <= 0)
      }
    }

    window.addEventListener("scroll", handleScroll)

    // Handle resize to maintain correct dimensions
    const handleResize = () => {
      if (ref.current) {
        setHeight(ref.current.offsetHeight)
        setWidth(ref.current.offsetWidth)
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <div ref={containerRef} className={className} style={{ position: "relative" }}>
      <div
        ref={ref}
        style={{
          position: isFixed ? "fixed" : "relative",
          top: isFixed ? 80 : 0,
          left: isFixed ? "50%" : 0,
          transform: isFixed ? "translateX(-50%)" : "none",
          width: isFixed ? width : "100%",
          maxWidth: isFixed ? width : "100%",
          zIndex: 1000,
          backgroundColor: "#f0f2f5",
          boxShadow: isFixed ? "0 2px 4px rgba(0,0,0,0.1)" : "none",
          transition: "box-shadow 0.5s ease, top 0.5s ease",
          borderRadius: "20px"
        }}
      >
        {children}
      </div>
      {isFixed && <div style={{ height: `${height}px` }} />}
    </div>
  )
}

