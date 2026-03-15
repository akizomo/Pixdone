import{a,j as r}from"./iframe-DbiBQxMl.js";import"./preload-helper-PPVm8Dsz.js";const x={title:"Components/Button",component:a,tags:["autodocs"],parameters:{docs:{description:{component:"**When to use:** Primary actions (Save, Submit), secondary actions (Cancel, Back), or low-emphasis actions (Skip). Use **primary** for the single main CTA; **secondary** for alternatives; **ghost** for tertiary; **danger** for destructive actions; **reward** for success/completion. **Accessibility:** Min 44px height for md/lg; focus-visible shows a 2px ring; disabled remains legible. **Visual:** Pixel shadow on primary/danger/reward; ghost is flat; press scale 0.96 for tactile feedback."}}},argTypes:{variant:{control:"select",options:["primary","secondary","ghost","danger","reward","signup","icon"]},size:{control:"select",options:["sm","md","lg"]}}},e={args:{variant:"primary",children:"Save"}},s={args:{variant:"secondary",children:"Cancel"}},n={args:{variant:"ghost",children:"Skip"}},t={args:{variant:"danger",children:"Delete"}},i={args:{variant:"reward",children:"Done"}},o={args:{size:"sm",children:"Small"}},d={args:{size:"md",children:"Medium"}},c={args:{size:"lg",children:"Large"}},l={args:{variant:"primary",disabled:!0,children:"Disabled"}},p={args:{variant:"primary",loading:!0,children:"Saving…"}},m={args:{variant:"primary",fullWidth:!0,children:"Full width"}},u={render:()=>r.jsxs("div",{style:{display:"flex",flexWrap:"wrap",gap:"var(--pxd-space-3)"},children:[r.jsx(a,{variant:"primary",children:"Primary"}),r.jsx(a,{variant:"secondary",children:"Secondary"}),r.jsx(a,{variant:"ghost",children:"Ghost"}),r.jsx(a,{variant:"danger",children:"Danger"}),r.jsx(a,{variant:"reward",children:"Reward"})]})},g={render:()=>r.jsxs("div",{style:{display:"flex",gap:"var(--pxd-space-3)",flexWrap:"wrap"},children:[r.jsx(a,{variant:"primary",children:"Confirm"}),r.jsx(a,{variant:"secondary",children:"Cancel"}),r.jsx(a,{variant:"ghost",children:"Skip"})]}),parameters:{docs:{description:{story:"Primary CTA with secondary and ghost alternatives."}}}},h={render:()=>r.jsxs("div",{style:{display:"flex",flexWrap:"wrap",gap:"var(--pxd-space-4)",alignItems:"center"},children:[r.jsx(a,{variant:"primary",children:"Default"}),r.jsx(a,{variant:"primary",disabled:!0,children:"Disabled"}),r.jsx(a,{variant:"primary",loading:!0,children:"Loading"})]}),parameters:{docs:{description:{story:"Default, disabled, and loading states side by side."}}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    children: 'Save'
  }
}`,...e.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'secondary',
    children: 'Cancel'
  }
}`,...s.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'ghost',
    children: 'Skip'
  }
}`,...n.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'danger',
    children: 'Delete'
  }
}`,...t.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'reward',
    children: 'Done'
  }
}`,...i.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'sm',
    children: 'Small'
  }
}`,...o.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'md',
    children: 'Medium'
  }
}`,...d.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'lg',
    children: 'Large'
  }
}`,...c.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    disabled: true,
    children: 'Disabled'
  }
}`,...l.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    loading: true,
    children: 'Saving…'
  }
}`,...p.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    fullWidth: true,
    children: 'Full width'
  }
}`,...m.parameters?.docs?.source}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--pxd-space-3)'
  }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="reward">Reward</Button>
    </div>
}`,...u.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    gap: 'var(--pxd-space-3)',
    flexWrap: 'wrap'
  }}>
      <Button variant="primary">Confirm</Button>
      <Button variant="secondary">Cancel</Button>
      <Button variant="ghost">Skip</Button>
    </div>,
  parameters: {
    docs: {
      description: {
        story: 'Primary CTA with secondary and ghost alternatives.'
      }
    }
  }
}`,...g.parameters?.docs?.source}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--pxd-space-4)',
    alignItems: 'center'
  }}>
      <Button variant="primary">Default</Button>
      <Button variant="primary" disabled>Disabled</Button>
      <Button variant="primary" loading>Loading</Button>
    </div>,
  parameters: {
    docs: {
      description: {
        story: 'Default, disabled, and loading states side by side.'
      }
    }
  }
}`,...h.parameters?.docs?.source}}};const S=["Primary","Secondary","Ghost","Danger","Reward","SizeSm","SizeMd","SizeLg","Disabled","Loading","FullWidth","AllVariants","HierarchyExample","StateComparison"];export{u as AllVariants,t as Danger,l as Disabled,m as FullWidth,n as Ghost,g as HierarchyExample,p as Loading,e as Primary,i as Reward,s as Secondary,c as SizeLg,d as SizeMd,o as SizeSm,h as StateComparison,S as __namedExportsOrder,x as default};
