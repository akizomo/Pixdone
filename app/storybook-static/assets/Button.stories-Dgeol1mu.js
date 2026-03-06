import{B as c}from"./iframe-BAfEoTu4.js";import"./preload-helper-PPVm8Dsz.js";const{fn:i}=__STORYBOOK_MODULE_TEST__,m={title:"PixDone/Design System/Button",component:c,tags:["autodocs"],argTypes:{variant:{control:"select",options:["primary","secondary","ghost","destructive","icon"]},loading:{control:"boolean"},disabled:{control:"boolean"}},args:{onClick:i()}},r={args:{variant:"primary",children:"Save"}},a={args:{variant:"secondary",children:"Cancel"}},e={args:{variant:"ghost",children:"Log in"}},n={args:{variant:"destructive",children:"Delete"}},s={args:{variant:"icon",children:"×","aria-label":"Close"}},o={args:{variant:"primary",children:"Saving...",loading:!0}},t={args:{variant:"primary",children:"Disabled",disabled:!0}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    children: 'Save'
  }
}`,...r.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'secondary',
    children: 'Cancel'
  }
}`,...a.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'ghost',
    children: 'Log in'
  }
}`,...e.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'destructive',
    children: 'Delete'
  }
}`,...n.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'icon',
    children: '×',
    'aria-label': 'Close'
  }
}`,...s.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    children: 'Saving...',
    loading: true
  }
}`,...o.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    children: 'Disabled',
    disabled: true
  }
}`,...t.parameters?.docs?.source}}};const p=["Primary","Secondary","Ghost","Destructive","Icon","Loading","Disabled"];export{n as Destructive,t as Disabled,e as Ghost,s as Icon,o as Loading,r as Primary,a as Secondary,p as __namedExportsOrder,m as default};
