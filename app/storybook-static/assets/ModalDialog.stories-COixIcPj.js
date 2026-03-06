import{M as s,j as o}from"./iframe-BAfEoTu4.js";import"./preload-helper-PPVm8Dsz.js";const{fn:e}=__STORYBOOK_MODULE_TEST__,i={title:"PixDone/Design System/ModalDialog",component:s,tags:["autodocs"],argTypes:{open:{control:"boolean"},title:{control:"text"}},args:{onClose:e()}},r={args:{open:!1,title:"Confirm",children:o.jsx("p",{children:"Modal content"})}},a={args:{open:!0,title:"Delete Task?",children:o.jsx("p",{children:"Are you sure you want to delete this task? This action cannot be undone."}),actions:[{label:"Cancel",onClick:e(),variant:"secondary"},{label:"Delete",onClick:e(),variant:"destructive"}]}},t={args:{open:!0,title:"Create New List",children:o.jsx("form",{onSubmit:n=>n.preventDefault(),children:o.jsx("input",{type:"text",placeholder:"List name",className:"w-full px-3 py-2 border-2 border-[var(--pd-color-border-default)] bg-[var(--pd-color-background-default)] text-[var(--pd-color-text-primary)]"})}),actions:[{label:"Cancel",onClick:e(),variant:"secondary"},{label:"Create",onClick:e(),variant:"primary"}]}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    open: false,
    title: 'Confirm',
    children: <p>Modal content</p>
  }
}`,...r.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    open: true,
    title: 'Delete Task?',
    children: <p>Are you sure you want to delete this task? This action cannot be undone.</p>,
    actions: [{
      label: 'Cancel',
      onClick: fn(),
      variant: 'secondary' as const
    }, {
      label: 'Delete',
      onClick: fn(),
      variant: 'destructive' as const
    }]
  }
}`,...a.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    open: true,
    title: 'Create New List',
    children: <form onSubmit={e => e.preventDefault()}>
        <input type="text" placeholder="List name" className="w-full px-3 py-2 border-2 border-[var(--pd-color-border-default)] bg-[var(--pd-color-background-default)] text-[var(--pd-color-text-primary)]" />
      </form>,
    actions: [{
      label: 'Cancel',
      onClick: fn(),
      variant: 'secondary' as const
    }, {
      label: 'Create',
      onClick: fn(),
      variant: 'primary' as const
    }]
  }
}`,...t.parameters?.docs?.source}}};const d=["Closed","Open","WithForm"];export{r as Closed,a as Open,t as WithForm,d as __namedExportsOrder,i as default};
