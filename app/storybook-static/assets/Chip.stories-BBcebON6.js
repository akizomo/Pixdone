import{C as r,j as e}from"./iframe-DbiBQxMl.js";import"./preload-helper-PPVm8Dsz.js";const h={title:"Components/Chip",component:r,tags:["autodocs"],parameters:{docs:{description:{component:'**When to use:** Filters, status labels, tags. **Accessibility:** Removable chips use a button with aria-label="Remove" (min 24px hit area). Selected state is conveyed visually and via aria-selected when used as an option. **Visual:** Compact padding; selected shows focus ring; variants use semantic colors with light tint backgrounds.'}}},argTypes:{variant:{control:"select",options:["neutral","accent","success","warning","danger"]},size:{control:"select",options:["sm","md"]}}},a={args:{variant:"neutral",children:"Neutral"}},s={args:{variant:"accent",children:"Accent"}},n={args:{variant:"success",children:"Done"}},t={args:{variant:"warning",children:"Pending"}},c={args:{variant:"danger",children:"Error"}},i={args:{variant:"accent",selected:!0,children:"Selected"}},o={args:{variant:"neutral",removable:!0,onRemove:()=>{},children:"Removable"}},l={args:{size:"sm",children:"Small"}},d={args:{size:"md",children:"Medium"}},p={render:()=>e.jsxs("div",{style:{display:"flex",flexWrap:"wrap",gap:"var(--pxd-space-2)"},children:[e.jsx(r,{variant:"neutral",children:"Neutral"}),e.jsx(r,{variant:"accent",children:"Accent"}),e.jsx(r,{variant:"success",children:"Success"}),e.jsx(r,{variant:"warning",children:"Warning"}),e.jsx(r,{variant:"danger",children:"Danger"}),e.jsx(r,{variant:"accent",selected:!0,children:"Selected"}),e.jsx(r,{variant:"neutral",removable:!0,onRemove:()=>{},children:"Removable"})]})},m={render:()=>e.jsxs("div",{style:{display:"flex",flexWrap:"wrap",gap:"var(--pxd-space-2)"},children:[e.jsx(r,{variant:"accent",selected:!0,children:"All"}),e.jsx(r,{variant:"neutral",children:"Active"}),e.jsx(r,{variant:"neutral",children:"Completed"})]}),parameters:{docs:{description:{story:"Filter chips with one selected."}}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'neutral',
    children: 'Neutral'
  }
}`,...a.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'accent',
    children: 'Accent'
  }
}`,...s.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'success',
    children: 'Done'
  }
}`,...n.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'warning',
    children: 'Pending'
  }
}`,...t.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'danger',
    children: 'Error'
  }
}`,...c.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'accent',
    selected: true,
    children: 'Selected'
  }
}`,...i.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'neutral',
    removable: true,
    onRemove: () => {},
    children: 'Removable'
  }
}`,...o.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'sm',
    children: 'Small'
  }
}`,...l.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'md',
    children: 'Medium'
  }
}`,...d.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--pxd-space-2)'
  }}>
      <Chip variant="neutral">Neutral</Chip>
      <Chip variant="accent">Accent</Chip>
      <Chip variant="success">Success</Chip>
      <Chip variant="warning">Warning</Chip>
      <Chip variant="danger">Danger</Chip>
      <Chip variant="accent" selected>Selected</Chip>
      <Chip variant="neutral" removable onRemove={() => {}}>Removable</Chip>
    </div>
}`,...p.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--pxd-space-2)'
  }}>
      <Chip variant="accent" selected>All</Chip>
      <Chip variant="neutral">Active</Chip>
      <Chip variant="neutral">Completed</Chip>
    </div>,
  parameters: {
    docs: {
      description: {
        story: 'Filter chips with one selected.'
      }
    }
  }
}`,...m.parameters?.docs?.source}}};const g=["Neutral","Accent","Success","Warning","Danger","Selected","Removable","SizeSm","SizeMd","AllVariants","FilterExample"];export{s as Accent,p as AllVariants,c as Danger,m as FilterExample,a as Neutral,o as Removable,i as Selected,d as SizeMd,l as SizeSm,n as Success,t as Warning,g as __namedExportsOrder,h as default};
