import 'tippy.js/dist/tippy.css'
import React, { useMemo, useState } from 'react'
import ReactDOM from 'react-dom'
import { createEditor } from 'slate'
import { withHistory } from 'slate-history'
import { Slate, withReact } from 'slate-react'
import {
  AlignPlugin,
  BalloonToolbar,
  BlockquotePlugin,
  BoldPlugin,
  MentionNodeData,
  CodeBlockPlugin,
  CodePlugin,
  withList,
  decorateSearchHighlight,
  EditablePlugins,
  ExitBreakPlugin,
  HeadingPlugin,
  HeadingToolbar,
  HighlightPlugin,
  ImagePlugin,
  ItalicPlugin,
  LinkPlugin,
  ListPlugin,
  MARK_BOLD,
  MARK_CODE,
  MARK_ITALIC,
  MARK_STRIKETHROUGH,
  MARK_SUBSCRIPT,
  MARK_SUPERSCRIPT,
  MARK_UNDERLINE,
  MediaEmbedPlugin,
  MentionPlugin,
  MentionSelect,
  ParagraphPlugin,
  ResetBlockTypePlugin,
  pipe,
  SearchHighlightPlugin,
  SoftBreakPlugin,
  StrikethroughPlugin,
  SubscriptPlugin,
  SuperscriptPlugin,
  TablePlugin,
  TodoListPlugin,
  ToolbarAlign,
  ToolbarElement,
  ToolbarImage,
  withCodeBlock,
  ToolbarLink,
  ToolbarList,
  ToolbarMark,
  ToolbarSearchHighlight,
  ToolbarCodeBlock,
  UnderlinePlugin,
  useMention,
  withAutoformat,
  withDeserializeHTML,
  withImageUpload,
  withInlineVoid,
  withLink,
  deserializeHTMLToDocumentFragment,
  withNormalizeTypes,
  withTable,
  withTrailingNode,
  serializeHTMLFromNodes,
  withMarks,
  KbdPlugin,
  MARK_KBD,
  withSelectOnBackspace,
} from '@udecode/slate-plugins'
import { MENTIONABLES, renderLabel } from './mentionables'
import { Node } from 'slate'
import { autoformatRules } from './autoformatRules'
import {
  headingTypes,
  initialValueAutoformat,
  initialValueBasicElements,
  initialValueBasicMarks,
  initialValueEmbeds,
  initialValueExitBreak,
  initialValueForcedLayout,
  initialValueHighlight,
  initialValueImages,
  initialValueLinks,
  initialValueList,
  initialValueMentions,
  initialValuePasteHtml,
  initialValueSoftBreak,
  initialValueTables,
  options,
  optionsResetBlockTypes,
} from './initialValues'

const plugins = [
  ParagraphPlugin(options),
  BlockquotePlugin(options),
  TodoListPlugin(options),
  HeadingPlugin(options),
  ImagePlugin(options),
  LinkPlugin(options),
  KbdPlugin(options),
  ListPlugin(options),
  MentionPlugin({
    mention: {
      ...options.mention,
      rootProps: {
        onClick: (mentionable: MentionNodeData) =>
          console.info(`Hello, I'm ${mentionable.value}`),
        prefix: '@',
        renderLabel,
      },
    },
  }),
  TablePlugin(options),
  AlignPlugin(options),
  MediaEmbedPlugin(options),
  CodeBlockPlugin(options),
  BoldPlugin(options),
  CodePlugin(options),
  ItalicPlugin(options),
  HighlightPlugin(options),
  SearchHighlightPlugin(options),
  UnderlinePlugin(options),
  StrikethroughPlugin(options),
  SubscriptPlugin(options),
  SuperscriptPlugin(options),
  ResetBlockTypePlugin(optionsResetBlockTypes),
  SoftBreakPlugin({
    rules: [
      { hotkey: 'shift+enter' },
      {
        hotkey: 'enter',
        query: {
          allow: [
            options.code_block.type,
            options.blockquote.type,
            options.td.type,
          ],
        },
      },
    ],
  }),
  ExitBreakPlugin({
    rules: [
      {
        hotkey: 'mod+enter',
        level: 1,
      },
      {
        hotkey: 'mod+shift+enter',
        before: true,
        level: 1,
      },
      {
        hotkey: 'enter',
        query: {
          start: true,
          end: true,
          allow: headingTypes,
        },
        level: 1,
      },
    ],
  }),
]

const withPlugins = [
  withReact,
  withHistory,
  withTable(options),
  withLink(options),
  withList(options),
  withCodeBlock(options),
  withDeserializeHTML({ plugins }),
  withImageUpload(),
  withAutoformat({ rules: autoformatRules }),
  withMarks(),
  withNormalizeTypes({
    rules: [{ path: [0, 0], strictType: options.h1.type }],
  }),
  withTrailingNode({ type: options.p.type, level: 1 }),
  withInlineVoid({ plugins }),
  withSelectOnBackspace({
    allow: [options.img.type, options.media_embed.type],
  }),
] as const

const initialValue: Node[] = [
  ...initialValueForcedLayout,
  ...initialValueBasicMarks,
  ...initialValueHighlight,
  ...initialValueBasicElements,
  ...initialValueList,
  ...initialValueTables,
  ...initialValueLinks,
  ...initialValueMentions,
  ...initialValueImages,
  ...initialValueEmbeds,
  ...initialValueAutoformat,
  ...initialValueSoftBreak,
  ...initialValueExitBreak,
  ...initialValuePasteHtml,
  {
    children: deserializeHTMLToDocumentFragment({
      plugins,
      element: '<p>Deserialized paragraph here.</p>',
    }),
  },
]

const App = () => {
  const [value, setValue] = useState(initialValue)

  const editor = useMemo(() => pipe(createEditor(), ...withPlugins), [])

  const [search, setSearchHighlight] = useState('')

  const decorate = [decorateSearchHighlight({ search })]

  const {
    index,
    search: mentionSearch,
    values,
    target,
    onChangeMention,
    onKeyDownMention,
  } = useMention(MENTIONABLES, {
    maxSuggestions: 10,
    trigger: '@',
    insertSpaceAfterMention: false,
    mentionableFilter: (s: string) => (mentionable: MentionNodeData) =>
      mentionable.email?.toLowerCase().includes(s.toLowerCase()) ||
      mentionable.name?.toLowerCase().includes(s.toLowerCase()),
    mentionableSearchPattern: '\\S*',
  })

  const onKeyDown = [onKeyDownMention]

  return (
    <Slate
      editor={editor}
      value={value}
      onChange={(newValue) => {
        setValue(newValue)

        if (JSON.stringify(newValue) !== JSON.stringify(value)) {
          const serializedHTML = serializeHTMLFromNodes({
            plugins,
            nodes: newValue,
          })
          console.log('serialized nodes', serializedHTML)
        }

        onChangeMention(editor)
      }}
    >
      <ToolbarSearchHighlight
        icon={() => <div />}
        setSearch={setSearchHighlight}
      />
      <HeadingToolbar>
        <ToolbarElement type={options.h1.type} icon={1} />
        <ToolbarElement type={options.h2.type} icon={2} />
        <ToolbarElement type={options.h3.type} icon={3} />
        <ToolbarElement type={options.h4.type} icon={4} />
        <ToolbarElement type={options.h5.type} icon={5} />
        <ToolbarElement type={options.h6.type} icon={6} />
        <ToolbarMark type={MARK_BOLD} icon={'B'} />
        <ToolbarMark type={MARK_ITALIC} icon={'I'} />
        <ToolbarMark type={MARK_UNDERLINE} icon={'U'} />
        <ToolbarMark type={MARK_STRIKETHROUGH} icon={'S'} />
        <ToolbarMark type={MARK_CODE} icon={'C'} />
        <ToolbarMark type={MARK_KBD} icon={'K'} />
        <ToolbarMark
          type={MARK_SUPERSCRIPT}
          clear={MARK_SUBSCRIPT}
          icon={'SP'}
        />
        <ToolbarMark
          type={MARK_SUBSCRIPT}
          clear={MARK_SUPERSCRIPT}
          icon={'SB'}
        />
        <ToolbarList {...options} typeList={options.ul.type} icon={'UL'} />
        <ToolbarList {...options} typeList={options.ol.type} icon={'OL'} />
        <ToolbarElement type={options.blockquote.type} icon={'BQ'} />
        <ToolbarCodeBlock type={options.code_block.type} icon={'CB'} />
        <ToolbarAlign icon={'al'} />
        <ToolbarAlign type={options.align_center.type} icon={'ac'} />
        <ToolbarAlign type={options.align_right.type} icon={'ar'} />

        <ToolbarLink {...options} icon={'A'} />
        <ToolbarImage {...options} icon={'IMG'} />
      </HeadingToolbar>
      <BalloonToolbar arrow>
        <ToolbarMark
          reversed
          type={MARK_BOLD}
          icon={'B'}
          tooltip={{ content: 'Bold (⌘B)' }}
        />
        <ToolbarMark
          reversed
          type={MARK_ITALIC}
          icon={'I'}
          tooltip={{ content: 'Italic (⌘I)' }}
        />
        <ToolbarMark
          reversed
          type={MARK_UNDERLINE}
          icon={'U'}
          tooltip={{ content: 'Underline (⌘U)' }}
        />
      </BalloonToolbar>
      <MentionSelect
        at={target}
        valueIndex={index}
        options={values}
        renderLabel={renderLabel}
      />
      <EditablePlugins
        style={{
          fontFamily:
            '-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"',
        }}
        plugins={plugins}
        decorate={decorate}
        decorateDeps={[search]}
        renderLeafDeps={[search]}
        onKeyDown={onKeyDown}
        onKeyDownDeps={[index, mentionSearch, target]}
        placeholder="Enter some plain text..."
      />
    </Slate>
  )
}

const rootElement = document.getElementById('root')
ReactDOM.render(<App />, rootElement)
