"use client"

import { useState, useEffect } from "react"

export function useMobileDetect() {
  const [isMobile, setIsMobile] = useState(false)
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    // Detectar dispositivos móveis pelo tamanho da tela
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Detectar dispositivos com tela de toque
    const checkTouch = () => {
      setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0 || (navigator as any).msMaxTouchPoints > 0)
    }

    // Verificar inicialmente
    checkMobile()
    checkTouch()

    // Adicionar listener para redimensionamento
    window.addEventListener("resize", checkMobile)

    // Limpar listener
    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  return { isMobile, isTouch }
}
