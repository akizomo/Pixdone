import{a as o,j as t}from"./iframe-BAfEoTu4.js";import"./preload-helper-PPVm8Dsz.js";const{fn:a}=__STORYBOOK_MODULE_TEST__,d={title:"PixDone/Design System/BottomSheet",component:o,tags:["autodocs"],argTypes:{open:{control:"boolean"},title:{control:"text"}},args:{onClose:a()}},e={args:{open:!1,title:"New Task",children:t.jsx("p",{children:"Sheet content"})}},r={args:{open:!0,title:"Edit Task",children:t.jsxs("div",{className:"space-y-4",children:[t.jsx("input",{type:"text",placeholder:"Title",className:"w-full px-3 py-2 border-2 border-[var(--pd-color-border-default)] bg-[var(--pd-color-background-default)] text-[var(--pd-color-text-primary)]"}),t.jsx("textarea",{placeholder:"Details",className:"w-full px-3 py-2 border-2 border-[var(--pd-color-border-default)] bg-[var(--pd-color-background-default)] text-[var(--pd-color-text-primary)] min-h-[80px]"})]})}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    open: false,
    title: 'New Task',
    children: <p>Sheet content</p>
  }
}`,...e.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    open: true,
    title: 'Edit Task',
    children: <div className="space-y-4">
        <input type="text" placeholder="Title" className="w-full px-3 py-2 border-2 border-[var(--pd-color-border-default)] bg-[var(--pd-color-background-default)] text-[var(--pd-color-text-primary)]" />
        <textarea placeholder="Details" className="w-full px-3 py-2 border-2 border-[var(--pd-color-border-default)] bg-[var(--pd-color-background-default)] text-[var(--pd-color-text-primary)] min-h-[80px]" />
      </div>
  }
}`,...r.parameters?.docs?.source}}};const p=["Closed","Open"];export{e as Closed,r as Open,p as __namedExportsOrder,d as default};
