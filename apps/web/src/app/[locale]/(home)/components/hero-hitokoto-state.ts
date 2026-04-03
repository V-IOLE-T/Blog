type HeroHitokotoConfig =
  | {
      custom?: string | null
      random?: boolean | null
    }
  | null
  | undefined

export const resolveHeroHitokotoState = ({
  appConfigHitokoto,
  latestHitokotoConfig,
  hasResolvedLatestHitokoto,
}: {
  appConfigHitokoto: HeroHitokotoConfig
  latestHitokotoConfig: HeroHitokotoConfig
  hasResolvedLatestHitokoto: boolean
}) => {
  if (!hasResolvedLatestHitokoto && appConfigHitokoto?.custom) {
    return {
      custom: null,
      random: false,
    }
  }

  return {
    custom: latestHitokotoConfig?.custom ?? appConfigHitokoto?.custom ?? null,
    random: Boolean(
      latestHitokotoConfig?.random ?? appConfigHitokoto?.random ?? false,
    ),
  }
}
