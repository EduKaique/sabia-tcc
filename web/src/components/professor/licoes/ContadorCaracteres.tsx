/** Contagem "n/máx" que só aparece perto do limite (a partir de 80%). */
export function ContadorCaracteres({ texto, maximo }: { texto: string; maximo: number }) {
  const n = texto.trim().length
  if (n < maximo * 0.8) return null
  return (
    <span className={`text-xs ${n > maximo ? 'text-destructive' : 'text-muted-foreground'}`}>
      {n}/{maximo}
    </span>
  )
}
