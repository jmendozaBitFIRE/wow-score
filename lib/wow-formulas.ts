export type Medio = 'TV' | 'Radio' | 'OOH' | 'DOOH' | 'Digital' | 'Impresos' | 'Cine'
export type Objetivo = 'Branding' | 'Ventas' | 'Lanzamiento' | 'Promocion' | 'Informativo' | 'BrandLove'

export interface Pesos {
  insight: number
  claridad: number
  stopping: number
  simplicidad: number
  pert: number
  adapt: number
  emocion: number
  recordacion: number
  estetica: number
  relevancia: number
}

export interface Formula {
  bondad: string
  pesos: Pesos
}

export const WOW_FORMULAS: Record<string, Formula> = {
  // ── TV ────────────────────────────────────────────────────
  TV_Branding: {
    bondad: 'Emoción + Storytelling + Fama',
    pesos: { insight: 20, claridad: 10, stopping: 15, simplicidad: 8, pert: 5, adapt: 5, emocion: 22, recordacion: 15, estetica: 10, relevancia: 5 },
  },
  TV_Ventas: {
    bondad: 'Emoción + Storytelling + Fama',
    pesos: { insight: 15, claridad: 18, stopping: 12, simplicidad: 12, pert: 8, adapt: 8, emocion: 15, recordacion: 8, estetica: 8, relevancia: 10 },
  },
  TV_Lanzamiento: {
    bondad: 'Emoción + Storytelling + Fama',
    pesos: { insight: 20, claridad: 12, stopping: 15, simplicidad: 8, pert: 8, adapt: 8, emocion: 20, recordacion: 10, estetica: 10, relevancia: 12 },
  },
  TV_Promocion: {
    bondad: 'Emoción + Storytelling + Fama',
    pesos: { insight: 15, claridad: 20, stopping: 15, simplicidad: 12, pert: 5, adapt: 5, emocion: 14, recordacion: 6, estetica: 6, relevancia: 12 },
  },
  TV_Informativo: {
    bondad: 'Emoción + Storytelling + Fama',
    pesos: { insight: 20, claridad: 22, stopping: 10, simplicidad: 12, pert: 8, adapt: 5, emocion: 14, recordacion: 6, estetica: 8, relevancia: 10 },
  },
  TV_BrandLove: {
    bondad: 'Emoción + Storytelling + Fama',
    pesos: { insight: 22, claridad: 10, stopping: 10, simplicidad: 5, pert: 5, adapt: 5, emocion: 30, recordacion: 12, estetica: 12, relevancia: 5 },
  },

  // ── Radio ─────────────────────────────────────────────────
  Radio_Branding: {
    bondad: 'Frecuencia + Voz + Activación',
    pesos: { insight: 18, claridad: 15, stopping: 18, simplicidad: 10, pert: 5, adapt: 8, emocion: 15, recordacion: 15, estetica: 6, relevancia: 4 },
  },
  Radio_Ventas: {
    bondad: 'Frecuencia + Voz + Activación',
    pesos: { insight: 12, claridad: 22, stopping: 15, simplicidad: 15, pert: 8, adapt: 10, emocion: 8, recordacion: 8, estetica: 4, relevancia: 8 },
  },
  Radio_Lanzamiento: {
    bondad: 'Frecuencia + Voz + Activación',
    pesos: { insight: 18, claridad: 18, stopping: 18, simplicidad: 10, pert: 8, adapt: 10, emocion: 12, recordacion: 10, estetica: 6, relevancia: 11 },
  },
  Radio_Promocion: {
    bondad: 'Frecuencia + Voz + Activación',
    pesos: { insight: 12, claridad: 25, stopping: 18, simplicidad: 15, pert: 5, adapt: 8, emocion: 6, recordacion: 6, estetica: 3, relevancia: 11 },
  },
  Radio_Informativo: {
    bondad: 'Frecuencia + Voz + Activación',
    pesos: { insight: 18, claridad: 28, stopping: 12, simplicidad: 15, pert: 8, adapt: 8, emocion: 6, recordacion: 6, estetica: 4, relevancia: 8 },
  },
  Radio_BrandLove: {
    bondad: 'Frecuencia + Voz + Activación',
    pesos: { insight: 20, claridad: 15, stopping: 12, simplicidad: 8, pert: 5, adapt: 8, emocion: 22, recordacion: 12, estetica: 9, relevancia: 4 },
  },

  // ── OOH ──────────────────────────────────────────────────
  OOH_Branding: {
    bondad: 'Impacto Visual + Simplicidad Brutal',
    pesos: { insight: 15, claridad: 18, stopping: 22, simplicidad: 15, pert: 5, adapt: 5, emocion: 12, recordacion: 11, estetica: 6, relevancia: 4 },
  },
  OOH_Ventas: {
    bondad: 'Impacto Visual + Simplicidad Brutal',
    pesos: { insight: 10, claridad: 25, stopping: 20, simplicidad: 20, pert: 8, adapt: 8, emocion: 4, recordacion: 4, estetica: 4, relevancia: 8 },
  },
  OOH_Lanzamiento: {
    bondad: 'Impacto Visual + Simplicidad Brutal',
    pesos: { insight: 15, claridad: 20, stopping: 22, simplicidad: 15, pert: 8, adapt: 8, emocion: 9, recordacion: 6, estetica: 6, relevancia: 11 },
  },
  OOH_Promocion: {
    bondad: 'Impacto Visual + Simplicidad Brutal',
    pesos: { insight: 10, claridad: 28, stopping: 22, simplicidad: 20, pert: 5, adapt: 5, emocion: 3, recordacion: 2, estetica: 3, relevancia: 11 },
  },
  OOH_Informativo: {
    bondad: 'Impacto Visual + Simplicidad Brutal',
    pesos: { insight: 15, claridad: 30, stopping: 18, simplicidad: 20, pert: 8, adapt: 5, emocion: 3, recordacion: 2, estetica: 4, relevancia: 8 },
  },
  OOH_BrandLove: {
    bondad: 'Impacto Visual + Simplicidad Brutal',
    pesos: { insight: 18, claridad: 18, stopping: 18, simplicidad: 12, pert: 5, adapt: 5, emocion: 19, recordacion: 8, estetica: 9, relevancia: 4 },
  },

  // ── DOOH ─────────────────────────────────────────────────
  DOOH_Branding: {
    bondad: 'Movimiento + 3D + Dinamismo',
    pesos: { insight: 15, claridad: 15, stopping: 25, simplicidad: 10, pert: 5, adapt: 8, emocion: 12, recordacion: 12, estetica: 8, relevancia: 4 },
  },
  DOOH_Ventas: {
    bondad: 'Movimiento + 3D + Dinamismo',
    pesos: { insight: 10, claridad: 22, stopping: 22, simplicidad: 15, pert: 8, adapt: 10, emocion: 5, recordacion: 4, estetica: 5, relevancia: 8 },
  },
  DOOH_Lanzamiento: {
    bondad: 'Movimiento + 3D + Dinamismo',
    pesos: { insight: 15, claridad: 18, stopping: 25, simplicidad: 10, pert: 8, adapt: 10, emocion: 10, recordacion: 6, estetica: 8, relevancia: 11 },
  },
  DOOH_Promocion: {
    bondad: 'Movimiento + 3D + Dinamismo',
    pesos: { insight: 10, claridad: 25, stopping: 25, simplicidad: 15, pert: 5, adapt: 8, emocion: 4, recordacion: 2, estetica: 4, relevancia: 11 },
  },
  DOOH_Informativo: {
    bondad: 'Movimiento + 3D + Dinamismo',
    pesos: { insight: 15, claridad: 28, stopping: 20, simplicidad: 15, pert: 8, adapt: 8, emocion: 4, recordacion: 2, estetica: 5, relevancia: 8 },
  },
  DOOH_BrandLove: {
    bondad: 'Movimiento + 3D + Dinamismo',
    pesos: { insight: 18, claridad: 15, stopping: 20, simplicidad: 8, pert: 5, adapt: 8, emocion: 20, recordacion: 9, estetica: 10, relevancia: 4 },
  },

  // ── Digital ───────────────────────────────────────────────
  Digital_Branding: {
    bondad: 'Segmentación + Performance + Cultura',
    pesos: { insight: 15, claridad: 12, stopping: 20, simplicidad: 8, pert: 12, adapt: 12, emocion: 12, recordacion: 11, estetica: 6, relevancia: 4 },
  },
  Digital_Ventas: {
    bondad: 'Segmentación + Performance + Cultura',
    pesos: { insight: 10, claridad: 20, stopping: 18, simplicidad: 12, pert: 15, adapt: 15, emocion: 4, recordacion: 4, estetica: 4, relevancia: 8 },
  },
  Digital_Lanzamiento: {
    bondad: 'Segmentación + Performance + Cultura',
    pesos: { insight: 15, claridad: 15, stopping: 20, simplicidad: 8, pert: 15, adapt: 15, emocion: 9, recordacion: 6, estetica: 6, relevancia: 11 },
  },
  Digital_Promocion: {
    bondad: 'Segmentación + Performance + Cultura',
    pesos: { insight: 10, claridad: 22, stopping: 20, simplicidad: 12, pert: 12, adapt: 12, emocion: 3, recordacion: 2, estetica: 3, relevancia: 11 },
  },
  Digital_Informativo: {
    bondad: 'Segmentación + Performance + Cultura',
    pesos: { insight: 15, claridad: 25, stopping: 15, simplicidad: 12, pert: 15, adapt: 12, emocion: 3, recordacion: 2, estetica: 4, relevancia: 8 },
  },
  Digital_BrandLove: {
    bondad: 'Segmentación + Performance + Cultura',
    pesos: { insight: 18, claridad: 12, stopping: 15, simplicidad: 5, pert: 12, adapt: 12, emocion: 19, recordacion: 8, estetica: 9, relevancia: 4 },
  },

  // ── Impresos ──────────────────────────────────────────────
  Impresos_Branding: {
    bondad: 'Prestigio + Atención Profunda',
    pesos: { insight: 20, claridad: 15, stopping: 15, simplicidad: 10, pert: 5, adapt: 5, emocion: 12, recordacion: 12, estetica: 12, relevancia: 5 },
  },
  Impresos_Ventas: {
    bondad: 'Prestigio + Atención Profunda',
    pesos: { insight: 15, claridad: 22, stopping: 12, simplicidad: 15, pert: 8, adapt: 8, emocion: 5, recordacion: 5, estetica: 10, relevancia: 10 },
  },
  Impresos_Lanzamiento: {
    bondad: 'Prestigio + Atención Profunda',
    pesos: { insight: 20, claridad: 18, stopping: 15, simplicidad: 10, pert: 8, adapt: 8, emocion: 10, recordacion: 8, estetica: 12, relevancia: 12 },
  },
  Impresos_Promocion: {
    bondad: 'Prestigio + Atención Profunda',
    pesos: { insight: 15, claridad: 25, stopping: 15, simplicidad: 15, pert: 5, adapt: 5, emocion: 4, recordacion: 4, estetica: 9, relevancia: 12 },
  },
  Impresos_Informativo: {
    bondad: 'Prestigio + Atención Profunda',
    pesos: { insight: 20, claridad: 28, stopping: 10, simplicidad: 15, pert: 8, adapt: 5, emocion: 4, recordacion: 4, estetica: 10, relevancia: 10 },
  },
  Impresos_BrandLove: {
    bondad: 'Prestigio + Atención Profunda',
    pesos: { insight: 22, claridad: 15, stopping: 10, simplicidad: 8, pert: 5, adapt: 5, emocion: 20, recordacion: 10, estetica: 15, relevancia: 5 },
  },

  // ── Cine ──────────────────────────────────────────────────
  Cine_Branding: {
    bondad: 'Emoción Épica + Inmersión',
    pesos: { insight: 20, claridad: 8, stopping: 15, simplicidad: 8, pert: 5, adapt: 5, emocion: 28, recordacion: 12, estetica: 9, relevancia: 4 },
  },
  Cine_Ventas: {
    bondad: 'Emoción Épica + Inmersión',
    pesos: { insight: 15, claridad: 15, stopping: 12, simplicidad: 12, pert: 8, adapt: 8, emocion: 20, recordacion: 5, estetica: 6, relevancia: 8 },
  },
  Cine_Lanzamiento: {
    bondad: 'Emoción Épica + Inmersión',
    pesos: { insight: 20, claridad: 10, stopping: 15, simplicidad: 8, pert: 8, adapt: 8, emocion: 25, recordacion: 8, estetica: 9, relevancia: 11 },
  },
  Cine_Promocion: {
    bondad: 'Emoción Épica + Inmersión',
    pesos: { insight: 15, claridad: 18, stopping: 15, simplicidad: 12, pert: 5, adapt: 5, emocion: 19, recordacion: 4, estetica: 6, relevancia: 11 },
  },
  Cine_Informativo: {
    bondad: 'Emoción Épica + Inmersión',
    pesos: { insight: 20, claridad: 20, stopping: 10, simplicidad: 12, pert: 8, adapt: 5, emocion: 19, recordacion: 4, estetica: 6, relevancia: 8 },
  },
  Cine_BrandLove: {
    bondad: 'Emoción Épica + Inmersión',
    pesos: { insight: 22, claridad: 8, stopping: 10, simplicidad: 5, pert: 5, adapt: 5, emocion: 35, recordacion: 10, estetica: 12, relevancia: 4 },
  },
}
