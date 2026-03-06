import{C as n,j as a}from"./iframe-BAfEoTu4.js";import"./preload-helper-PPVm8Dsz.js";const{fn:c}=__STORYBOOK_MODULE_TEST__,d={title:"PixDone/Design System/Chip",component:n,tags:["autodocs"],argTypes:{selected:{control:"boolean"}},args:{onClick:c()}},e={args:{children:"En",selected:!1}},s={args:{children:"Ja",selected:!0}},r={render:()=>a.jsxs("div",{className:"flex gap-2",children:[a.jsx(n,{selected:!0,children:"En"}),a.jsx(n,{selected:!1,children:"Ja"})]})};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    children: 'En',
    selected: false
  }
}`,...e.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    children: 'Ja',
    selected: true
  }
}`,...s.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex gap-2">
      <Chip selected>En</Chip>
      <Chip selected={false}>Ja</Chip>
    </div>
}`,...r.parameters?.docs?.source}}};const l=["Unselected","Selected","LanguageChips"];export{r as LanguageChips,s as Selected,e as Unselected,l as __namedExportsOrder,d as default};
