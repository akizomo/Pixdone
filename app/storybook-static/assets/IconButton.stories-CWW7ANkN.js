import{I as r,j as a}from"./iframe-DbiBQxMl.js";import"./preload-helper-PPVm8Dsz.js";const e=()=>a.jsx("span",{"aria-hidden":!0,children:"×"}),g=()=>a.jsx("span",{"aria-hidden":!0,children:"+"}),u=()=>a.jsx("span",{"aria-hidden":!0,children:"🗑"}),v={title:"Components/IconButton",component:r,tags:["autodocs"],parameters:{docs:{description:{component:"**When to use:** Icon-only actions (close, add, delete, settings). **Accessibility:** `aria-label` is required. Min 44×44px for md/lg; focus-visible shows a 2px ring. **Visual:** Centered icon; same variant/size logic as Button; tactile press scale."}}},argTypes:{variant:{control:"select",options:["primary","secondary","ghost","danger"]},size:{control:"select",options:["sm","md","lg"]}}},s={args:{variant:"primary","aria-label":"Close",icon:a.jsx(e,{})}},o={args:{variant:"secondary","aria-label":"Add",icon:a.jsx(g,{})}},n={args:{variant:"ghost","aria-label":"More options",icon:a.jsx(e,{})}},i={args:{variant:"danger","aria-label":"Delete",icon:a.jsx(u,{})}},c={args:{size:"sm","aria-label":"Close",icon:a.jsx(e,{})}},t={args:{size:"md","aria-label":"Close",icon:a.jsx(e,{})}},l={args:{size:"lg","aria-label":"Close",icon:a.jsx(e,{})}},d={args:{variant:"primary",disabled:!0,"aria-label":"Close",icon:a.jsx(e,{})}},p={render:()=>a.jsxs("div",{style:{display:"flex",gap:"var(--pxd-space-3)",flexWrap:"wrap",alignItems:"center"},children:[a.jsx(r,{variant:"primary","aria-label":"Close",icon:a.jsx(e,{})}),a.jsx(r,{variant:"secondary","aria-label":"Add",icon:a.jsx(g,{})}),a.jsx(r,{variant:"ghost","aria-label":"More",icon:a.jsx(e,{})}),a.jsx(r,{variant:"danger","aria-label":"Delete",icon:a.jsx(u,{})})]})},m={render:()=>a.jsxs("div",{style:{display:"flex",gap:"var(--pxd-space-4)",alignItems:"center"},children:[a.jsx(r,{size:"sm",variant:"secondary","aria-label":"Small",icon:a.jsx(e,{})}),a.jsx(r,{size:"md",variant:"secondary","aria-label":"Medium",icon:a.jsx(e,{})}),a.jsx(r,{size:"lg",variant:"secondary","aria-label":"Large",icon:a.jsx(e,{})})]}),parameters:{docs:{description:{story:"Sm 36px, md 44px, lg 48px tap targets."}}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    'aria-label': 'Close',
    icon: <CloseIcon />
  }
}`,...s.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'secondary',
    'aria-label': 'Add',
    icon: <PlusIcon />
  }
}`,...o.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'ghost',
    'aria-label': 'More options',
    icon: <CloseIcon />
  }
}`,...n.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'danger',
    'aria-label': 'Delete',
    icon: <TrashIcon />
  }
}`,...i.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'sm',
    'aria-label': 'Close',
    icon: <CloseIcon />
  }
}`,...c.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'md',
    'aria-label': 'Close',
    icon: <CloseIcon />
  }
}`,...t.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'lg',
    'aria-label': 'Close',
    icon: <CloseIcon />
  }
}`,...l.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    disabled: true,
    'aria-label': 'Close',
    icon: <CloseIcon />
  }
}`,...d.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    gap: 'var(--pxd-space-3)',
    flexWrap: 'wrap',
    alignItems: 'center'
  }}>
      <IconButton variant="primary" aria-label="Close" icon={<CloseIcon />} />
      <IconButton variant="secondary" aria-label="Add" icon={<PlusIcon />} />
      <IconButton variant="ghost" aria-label="More" icon={<CloseIcon />} />
      <IconButton variant="danger" aria-label="Delete" icon={<TrashIcon />} />
    </div>
}`,...p.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    gap: 'var(--pxd-space-4)',
    alignItems: 'center'
  }}>
      <IconButton size="sm" variant="secondary" aria-label="Small" icon={<CloseIcon />} />
      <IconButton size="md" variant="secondary" aria-label="Medium" icon={<CloseIcon />} />
      <IconButton size="lg" variant="secondary" aria-label="Large" icon={<CloseIcon />} />
    </div>,
  parameters: {
    docs: {
      description: {
        story: 'Sm 36px, md 44px, lg 48px tap targets.'
      }
    }
  }
}`,...m.parameters?.docs?.source}}};const y=["Primary","Secondary","Ghost","Danger","SizeSm","SizeMd","SizeLg","Disabled","AllVariants","SizeComparison"];export{p as AllVariants,i as Danger,d as Disabled,n as Ghost,s as Primary,o as Secondary,m as SizeComparison,l as SizeLg,t as SizeMd,c as SizeSm,y as __namedExportsOrder,v as default};
