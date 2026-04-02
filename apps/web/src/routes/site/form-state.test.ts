import { describe, expect, it } from 'vitest'

import {
  buildSiteSettingsMutationPayloads,
  createSiteSettingsFormState,
} from './form-state'

describe('site settings form state', () => {
  it('builds editable form state from aggregate data and theme snippet', () => {
    const state = createSiteSettingsFormState(
      {
        seo: {
          title: "OO's blog",
          description: 'Welcome!',
        },
        user: {
          socialIds: {
            github: 'https://github.com/V-IOLE-T',
            x: '',
          },
        },
      },
      {
        config: {
          hero: {
            title: {
              template: [
                { type: 'text', text: 'Temporary ' },
                { type: 'text', text: '<MixSpace />', class: 'font-serif' },
              ],
            },
            description:
              'An initialized placeholder site for Mix Space Core and Shiro.',
            hitokoto: {
              custom: 'Orbit is only the beginning.',
            },
          },
        },
        footer: {
          linkSections: [
            {
              name: '关于',
              links: [{ name: '关于我', href: '/about' }],
            },
          ],
        },
      },
    )

    expect(state).toEqual({
      heroDescription:
        'An initialized placeholder site for Mix Space Core and Shiro.',
      heroQuote: 'Orbit is only the beginning.',
      heroTitle: 'Temporary <MixSpace />',
      linkSections: [
        {
          links: [{ href: '/about', name: '关于我' }],
          name: '关于',
        },
      ],
      seoDescription: 'Welcome!',
      seoTitle: "OO's blog",
      socialLinks: [{ key: 'github', value: 'https://github.com/V-IOLE-T' }],
    })
  })

  it('splits save payloads into seo, owner and theme snippet updates', () => {
    const payloads = buildSiteSettingsMutationPayloads({
      form: {
        seoTitle: 'OO Journal',
        seoDescription: 'Notes and posts',
        heroTitle: 'OO Journal',
        heroDescription: 'A calmer home page',
        heroQuote: 'When satellites leave the sky, we dream of the cosmos.',
        socialLinks: [
          { key: 'github', value: 'https://github.com/V-IOLE-T' },
          { key: 'email', value: 'mailto:z411622h@163.com' },
          { key: '', value: 'ignored' },
        ],
        linkSections: [
          {
            name: '联系',
            links: [
              { name: 'Email', href: 'mailto:z411622h@163.com' },
              { name: '', href: '' },
            ],
          },
        ],
      },
      previousThemeSnippet: {
        id: 'theme-id',
        name: 'shiro',
        reference: 'theme',
        type: 'json',
        private: false,
        raw: '{"footer":{"linkSections":[]}}',
      },
      previousThemeConfig: {
        config: {
          hero: {
            title: {
              template: [{ type: 'text', text: 'Temporary <MixSpace />' }],
            },
            description: 'Old hero',
            hitokoto: {
              random: true,
            },
          },
          module: {},
          site: {
            favicon: '/favicon.ico',
          },
        },
        footer: {
          otherInfo: {
            date: '2026-{{now}}',
          },
          linkSections: [],
        },
      },
    })

    expect(payloads.seo).toEqual({
      description: 'Notes and posts',
      title: 'OO Journal',
    })
    expect(payloads.owner).toEqual({
      socialIds: {
        email: 'mailto:z411622h@163.com',
        github: 'https://github.com/V-IOLE-T',
      },
    })
    expect(payloads.themeSnippet).toMatchObject({
      id: 'theme-id',
      name: 'shiro',
      private: false,
      reference: 'theme',
      type: 'json',
    })
    expect(JSON.parse(payloads.themeSnippet.raw)).toEqual({
      config: {
        hero: {
          description: 'A calmer home page',
          hitokoto: {
            custom: 'When satellites leave the sky, we dream of the cosmos.',
            random: false,
          },
          title: {
            template: [{ type: 'text', text: 'OO Journal' }],
          },
        },
        module: {},
        site: {
          favicon: '/favicon.ico',
        },
      },
      footer: {
        linkSections: [
          {
            links: [{ href: 'mailto:z411622h@163.com', name: 'Email' }],
            name: '联系',
          },
        ],
        otherInfo: {
          date: '2026-{{now}}',
        },
      },
    })
  })
})
