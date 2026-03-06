import{T as l}from"./iframe-BAfEoTu4.js";import"./preload-helper-PPVm8Dsz.js";const d={title:"PixDone/Design System/TextField",component:l,tags:["autodocs"],argTypes:{label:{control:"text"},error:{control:"text"},placeholder:{control:"text"},disabled:{control:"boolean"}}},e={args:{placeholder:"Enter text"}},a={args:{label:"Email",placeholder:"you@example.com"}},r={args:{label:"Email",value:"invalid",error:"Please enter a valid email address."}},s={args:{label:"Password",type:"password",placeholder:"••••••••",passwordToggle:!0}},o={args:{label:"Disabled",value:"Read only",disabled:!0}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    placeholder: 'Enter text'
  }
}`,...e.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Email',
    placeholder: 'you@example.com'
  }
}`,...a.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Email',
    value: 'invalid',
    error: 'Please enter a valid email address.'
  }
}`,...r.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Password',
    type: 'password',
    placeholder: '••••••••',
    passwordToggle: true
  }
}`,...s.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Disabled',
    value: 'Read only',
    disabled: true
  }
}`,...o.parameters?.docs?.source}}};const c=["Default","WithLabel","WithError","Password","Disabled"];export{e as Default,o as Disabled,s as Password,r as WithError,a as WithLabel,c as __namedExportsOrder,d as default};
