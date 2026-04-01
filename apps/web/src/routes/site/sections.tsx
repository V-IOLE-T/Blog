import { StyledButton } from '~/components/ui/button'
import { Input, TextArea } from '~/components/ui/input'

import type { EditableLinkSection, SiteSettingsFormState } from './form-state'

export const SectionCard: Component<{
  title: string
  description: string
}> = ({ title, description, children }) => (
  <section className="rounded-[28px] border border-neutral-3 bg-neutral-1/80 p-5 shadow-sm">
    <header className="mb-4">
      <h2 className="text-lg font-medium text-neutral-9">{title}</h2>
      <p className="mt-1 text-sm text-neutral-6">{description}</p>
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
  value,
  onChange,
}: {
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
                                  ? { ...currentLink, name: event.target.value }
                                  : currentLink,
                            ),
                          }
                        : current,
                    ),
                  )
                }
              />
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
