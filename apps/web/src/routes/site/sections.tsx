import { StyledButton } from '~/components/ui/button'
import { Input, TextArea } from '~/components/ui/input'

import type { EditableLinkSection, SiteSettingsFormState } from './form-state'
import type {
  SiteTranslationLang,
  SiteTranslationStatusMap,
} from './site-translation'

export const SectionCard: Component<{
  title: string
  description: string
  actions?: React.ReactNode
}> = ({ title, description, actions, children }) => (
  <section className="rounded-[28px] border border-neutral-3 bg-neutral-1/80 p-5 shadow-sm">
    <header className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <h2 className="text-lg font-medium text-neutral-9">{title}</h2>
        <p className="mt-1 text-sm text-neutral-6">{description}</p>
      </div>
      {actions ? <div>{actions}</div> : null}
    </header>
    <div className="space-y-4">{children}</div>
  </section>
)

export const FieldLabel: Component<{ title: string; hint?: string }> = ({
  title,
  hint,
}) => (
  <div className="mb-2">
    <label className="text-sm font-medium text-neutral-8">{title}</label>
    {hint && <p className="mt-1 text-xs text-neutral-5">{hint}</p>}
  </div>
)

type TranslationStatusValue = SiteTranslationStatusMap[string] | undefined

const TRANSLATION_STATUS_LANGS: SiteTranslationLang[] = ['en', 'ja']

export const TranslationStatusBadges = ({
  status,
}: {
  status?: TranslationStatusValue
}) => (
  <div className="mt-2 flex flex-wrap gap-2">
    {TRANSLATION_STATUS_LANGS.map((lang) => {
      const translated = !!status?.[lang]
      const code = lang.toUpperCase()

      return (
        <span
          key={lang}
          className={
            translated
              ? 'rounded-full border border-emerald-300/70 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700'
              : 'rounded-full border border-neutral-3/80 bg-neutral-2/60 px-2 py-0.5 text-[11px] font-medium text-neutral-6'
          }
        >
          {code} {translated ? '已翻译' : '未翻译'}
        </span>
      )
    })}
  </div>
)

export const SocialLinksEditor = ({
  value,
  onChange,
}: {
  value: SiteSettingsFormState['socialLinks']
  onChange: (next: SiteSettingsFormState['socialLinks']) => void
}) => (
  <div className="space-y-3">
    {value.map((item, index) => (
      <div
        className="grid gap-2 md:grid-cols-[180px_minmax(0,1fr)_auto]"
        key={`${item.key}-${index}`}
      >
        <Input
          placeholder="github"
          value={item.key}
          onChange={(event) =>
            onChange(
              value.map((current, currentIndex) =>
                currentIndex === index
                  ? { ...current, key: event.target.value }
                  : current,
              ),
            )
          }
        />
        <Input
          placeholder="https://github.com/..."
          value={item.value}
          onChange={(event) =>
            onChange(
              value.map((current, currentIndex) =>
                currentIndex === index
                  ? { ...current, value: event.target.value }
                  : current,
              ),
            )
          }
        />
        <StyledButton
          type="button"
          variant="ghost"
          onClick={() =>
            onChange(value.filter((_, currentIndex) => currentIndex !== index))
          }
        >
          删除
        </StyledButton>
      </div>
    ))}

    <StyledButton
      type="button"
      variant="secondary"
      onClick={() => onChange([...value, { key: '', value: '' }])}
    >
      添加社交链接
    </StyledButton>
  </div>
)

export const FooterLinksEditor = ({
  getTranslationStatus,
  value,
  onChange,
}: {
  getTranslationStatus?: (fieldId: string) => TranslationStatusValue
  value: EditableLinkSection[]
  onChange: (next: EditableLinkSection[]) => void
}) => (
  <div className="space-y-4">
    {value.map((section, sectionIndex) => (
      <div
        className="rounded-2xl border border-neutral-3/80 bg-neutral-2/30 p-4"
        key={`${section.name}-${sectionIndex}`}
      >
        <div className="mb-3 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <Input
              className="max-w-xs"
              placeholder="分组标题"
              value={section.name}
              onChange={(event) =>
                onChange(
                  value.map((current, currentIndex) =>
                    currentIndex === sectionIndex
                      ? { ...current, name: event.target.value }
                      : current,
                  ),
                )
              }
            />
            <TranslationStatusBadges
              status={getTranslationStatus?.(
                `footer.section.${sectionIndex}.name`,
              )}
            />
          </div>
          <StyledButton
            type="button"
            variant="ghost"
            onClick={() =>
              onChange(
                value.filter(
                  (_, currentIndex) => currentIndex !== sectionIndex,
                ),
              )
            }
          >
            删除分组
          </StyledButton>
        </div>

        <div className="space-y-2">
          {section.links.map((link, linkIndex) => (
            <div
              className="grid gap-2 md:grid-cols-[220px_minmax(0,1fr)_auto]"
              key={`${link.name}-${linkIndex}`}
            >
              <div>
                <Input
                  placeholder="链接名称"
                  value={link.name}
                  onChange={(event) =>
                    onChange(
                      value.map((current, currentIndex) =>
                        currentIndex === sectionIndex
                          ? {
                              ...current,
                              links: current.links.map(
                                (currentLink, currentLinkIndex) =>
                                  currentLinkIndex === linkIndex
                                    ? {
                                        ...currentLink,
                                        name: event.target.value,
                                      }
                                    : currentLink,
                              ),
                            }
                          : current,
                      ),
                    )
                  }
                />
                <TranslationStatusBadges
                  status={getTranslationStatus?.(
                    `footer.section.${sectionIndex}.link.${linkIndex}.name`,
                  )}
                />
              </div>
              <Input
                placeholder="/about 或 https://..."
                value={link.href}
                onChange={(event) =>
                  onChange(
                    value.map((current, currentIndex) =>
                      currentIndex === sectionIndex
                        ? {
                            ...current,
                            links: current.links.map(
                              (currentLink, currentLinkIndex) =>
                                currentLinkIndex === linkIndex
                                  ? { ...currentLink, href: event.target.value }
                                  : currentLink,
                            ),
                          }
                        : current,
                    ),
                  )
                }
              />
              <StyledButton
                type="button"
                variant="ghost"
                onClick={() =>
                  onChange(
                    value.map((current, currentIndex) =>
                      currentIndex === sectionIndex
                        ? {
                            ...current,
                            links: current.links.filter(
                              (_, currentLinkIndex) =>
                                currentLinkIndex !== linkIndex,
                            ),
                          }
                        : current,
                    ),
                  )
                }
              >
                删除
              </StyledButton>
            </div>
          ))}
        </div>

        <div className="mt-3">
          <StyledButton
            type="button"
            variant="secondary"
            onClick={() =>
              onChange(
                value.map((current, currentIndex) =>
                  currentIndex === sectionIndex
                    ? {
                        ...current,
                        links: [...current.links, { name: '', href: '' }],
                      }
                    : current,
                ),
              )
            }
          >
            添加链接
          </StyledButton>
        </div>
      </div>
    ))}

    <StyledButton
      type="button"
      variant="secondary"
      onClick={() =>
        onChange([...value, { name: '', links: [{ name: '', href: '' }] }])
      }
    >
      添加分组
    </StyledButton>
  </div>
)

export const MultiLineHint = ({ value }: { value: string }) => (
  <TextArea
    readOnly
    bordered={false}
    className="min-h-24 text-xs text-neutral-5"
    value={value}
  />
)
