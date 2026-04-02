export type SocialLinkField = {
  key: string
  value: string
}

export type EditableLink = {
  name: string
  href: string
}

export type EditableLinkSection = {
  name: string
  links: EditableLink[]
}

export type SiteSettingsFormState = {
  seoTitle: string
  seoDescription: string
  heroTitle: string
  heroDescription: string
  heroQuote: string
  socialLinks: SocialLinkField[]
  linkSections: EditableLinkSection[]
}

type AggregateLike = {
  seo?: {
    title?: string
    description?: string
  }
  user?: {
    socialIds?: Record<string, string>
  }
}

type ThemeLike = {
  config?: {
    hero?: {
      title?: {
        template?: Array<{
          text?: string
          type?: string
          class?: string
        }>
      }
      description?: string
      hitokoto?: {
        random?: boolean
        custom?: string
      }
    }
    module?: Partial<AppConfig['module']>
    site?: Partial<AppConfig['site']>
  }
  footer?: {
    otherInfo?: {
      date?: string
      icp?: {
        text: string
        link: string
      }
    }
    linkSections?: LinkSection[]
  }
}

type ThemeSnippetInput = {
  id?: string
  name: string
  reference: string
  type: string
  private?: boolean
  raw: string
}

export const createSiteSettingsFormState = (
  aggregate: AggregateLike,
  theme: ThemeLike,
): SiteSettingsFormState => {
  const socialIds = aggregate.user?.socialIds || {}
  const heroTemplate = theme.config?.hero?.title?.template || []
  const linkSections = theme.footer?.linkSections || []

  return {
    seoTitle: aggregate.seo?.title || '',
    seoDescription: aggregate.seo?.description || '',
    heroTitle: heroTemplate.map((item) => item.text || '').join(''),
    heroDescription: theme.config?.hero?.description || '',
    heroQuote: theme.config?.hero?.hitokoto?.custom || '',
    socialLinks: Object.entries(socialIds)
      .filter(([, value]) => !!value?.trim())
      .map(([key, value]) => ({ key, value })),
    linkSections: sanitizeLinkSections(linkSections),
  }
}

export const buildSiteSettingsMutationPayloads = ({
  form,
  previousThemeSnippet,
  previousThemeConfig,
}: {
  form: SiteSettingsFormState
  previousThemeSnippet: ThemeSnippetInput
  previousThemeConfig: ThemeLike
}) => {
  const previousConfig = previousThemeConfig.config || {}
  const previousHero = previousConfig.hero || {}
  const previousFooter = previousThemeConfig.footer || {}
  const nextHeroQuote = form.heroQuote.trim()

  const sanitizedSocialIds = Object.fromEntries(
    form.socialLinks
      .map((item) => ({
        key: item.key.trim(),
        value: item.value.trim(),
      }))
      .filter((item) => item.key && item.value)
      .map((item) => [item.key, item.value]),
  )

  const nextThemeConfig = {
    ...previousThemeConfig,
    config: {
      ...previousConfig,
      hero: {
        ...previousHero,
        title: {
          template: [
            {
              type: 'text',
              text: form.heroTitle.trim(),
            },
          ],
        },
        description: form.heroDescription.trim(),
        hitokoto: {
          ...previousHero.hitokoto,
          random: nextHeroQuote ? false : previousHero.hitokoto?.random,
          custom: nextHeroQuote || undefined,
        },
      },
    },
    footer: {
      ...previousFooter,
      linkSections: sanitizeLinkSections(form.linkSections),
    },
  }

  return {
    seo: {
      title: form.seoTitle.trim(),
      description: form.seoDescription.trim(),
    },
    owner: {
      socialIds: sanitizedSocialIds,
    },
    themeSnippet: {
      ...previousThemeSnippet,
      private: previousThemeSnippet.private ?? false,
      raw: JSON.stringify(nextThemeConfig),
    },
  }
}

const sanitizeLinkSections = (
  sections: Array<{
    name: string
    links: Array<{
      name: string
      href: string
      external?: boolean
    }>
  }>,
): EditableLinkSection[] =>
  sections
    .map((section) => ({
      name: section.name.trim(),
      links: section.links
        .map((link) => ({
          name: link.name.trim(),
          href: link.href.trim(),
        }))
        .filter((link) => link.name && link.href),
    }))
    .filter((section) => section.name && section.links.length > 0)
