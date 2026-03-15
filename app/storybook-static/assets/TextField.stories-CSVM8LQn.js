import{T as r,j as e}from"./iframe-DbiBQxMl.js";import"./preload-helper-PPVm8Dsz.js";const u={title:"Components/TextField",component:r,tags:["autodocs"],parameters:{docs:{description:{component:"**When to use:** Form fields for text, email, password, search. **Accessibility:** Associate label via `htmlFor`/`id`; use `aria-describedby` for helper/error; `aria-invalid` when error. **Visual:** Clear default border, stronger border on hover, focus ring (3px soft blue); error state uses danger border and red helper text. Min height 44px for touch."}}}},a={args:{placeholder:"Enter text"}},s={args:{label:"Email",placeholder:"you@example.com",type:"email"}},l={args:{label:"Username",placeholder:"username",helperText:"Choose a unique username."}},o={args:{label:"Password",placeholder:"••••••••",type:"password",errorText:"Password must be at least 8 characters."}},t={args:{label:"Disabled",placeholder:"Disabled field",disabled:!0}},d={args:{label:"Required field",placeholder:"Required",required:!0}},c={args:{label:"Search",placeholder:"Search…",type:"search",helperText:"Search by name or ID."}},i={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"var(--pxd-space-6)",maxWidth:320},children:[e.jsx(r,{label:"Default",placeholder:"Placeholder"}),e.jsx(r,{label:"Filled",defaultValue:"Some value"}),e.jsx(r,{label:"Error",errorText:"This field is required.",placeholder:"Required"}),e.jsx(r,{label:"Disabled",placeholder:"Disabled",disabled:!0})]}),parameters:{docs:{description:{story:"Default, filled, error, and disabled states."}}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    placeholder: 'Enter text'
  }
}`,...a.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Email',
    placeholder: 'you@example.com',
    type: 'email'
  }
}`,...s.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Username',
    placeholder: 'username',
    helperText: 'Choose a unique username.'
  }
}`,...l.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Password',
    placeholder: '••••••••',
    type: 'password',
    errorText: 'Password must be at least 8 characters.'
  }
}`,...o.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Disabled',
    placeholder: 'Disabled field',
    disabled: true
  }
}`,...t.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Required field',
    placeholder: 'Required',
    required: true
  }
}`,...d.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Search',
    placeholder: 'Search…',
    type: 'search',
    helperText: 'Search by name or ID.'
  }
}`,...c.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--pxd-space-6)',
    maxWidth: 320
  }}>
      <TextField label="Default" placeholder="Placeholder" />
      <TextField label="Filled" defaultValue="Some value" />
      <TextField label="Error" errorText="This field is required." placeholder="Required" />
      <TextField label="Disabled" placeholder="Disabled" disabled />
    </div>,
  parameters: {
    docs: {
      description: {
        story: 'Default, filled, error, and disabled states.'
      }
    }
  }
}`,...i.parameters?.docs?.source}}};const m=["Default","WithLabel","WithHelperText","WithError","Disabled","Required","SearchField","StateComparison"];export{a as Default,t as Disabled,d as Required,c as SearchField,i as StateComparison,o as WithError,l as WithHelperText,s as WithLabel,m as __namedExportsOrder,u as default};
