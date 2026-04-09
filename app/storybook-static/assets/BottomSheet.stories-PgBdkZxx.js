import{B as l,r as i,j as e,a as n}from"./iframe-DbiBQxMl.js";import"./preload-helper-PPVm8Dsz.js";const m={title:"Components/BottomSheet",component:l,tags:["autodocs"],parameters:{docs:{description:{component:'**When to use:** Mobile-style actions, filters, or supplementary content. **Accessibility:** role="dialog", aria-modal, aria-labelledby when titled; ESC closes; close button has 44px target. **Visual:** Token spacing; handle bar when showHandle; smooth slide-up entrance; overlay fades in.'}}},argTypes:{snap:{control:"select",options:["content","medium","large"]}}},s={render:function(){const[o,t]=i.useState(!1);return e.jsxs(e.Fragment,{children:[e.jsx(n,{variant:"primary",onClick:()=>t(!0),children:"Open sheet"}),e.jsx(l,{open:o,onClose:()=>t(!1),title:"Sheet title",children:e.jsx("p",{children:"Content goes here. Touch-friendly spacing applied."})})]})}},a={render:function(){const[o,t]=i.useState(!1);return e.jsxs(e.Fragment,{children:[e.jsx(n,{variant:"secondary",onClick:()=>t(!0),children:"Options"}),e.jsx(l,{open:o,onClose:()=>t(!1),title:"Choose action",showHandle:!0,children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"var(--pxd-space-2)"},children:[e.jsx(n,{variant:"primary",fullWidth:!0,onClick:()=>t(!1),children:"Save"}),e.jsx(n,{variant:"secondary",fullWidth:!0,onClick:()=>t(!1),children:"Share"}),e.jsx(n,{variant:"ghost",fullWidth:!0,onClick:()=>t(!1),children:"Cancel"})]})})]})}},r={render:function(){const[o,t]=i.useState(!1);return e.jsxs(e.Fragment,{children:[e.jsx(n,{variant:"secondary",onClick:()=>t(!0),children:"Open long content"}),e.jsx(l,{open:o,onClose:()=>t(!1),title:"Scrollable content",snap:"large",children:e.jsx("div",{style:{paddingBottom:"var(--pxd-space-6)"},children:Array.from({length:20},(d,p)=>e.jsxs("p",{children:["Paragraph ",p+1,". Lorem ipsum dolor sit amet."]},p))})})]})}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: function Basic() {
    const [open, setOpen] = useState(false);
    return <>
        <Button variant="primary" onClick={() => setOpen(true)}>Open sheet</Button>
        <BottomSheet open={open} onClose={() => setOpen(false)} title="Sheet title">
          <p>Content goes here. Touch-friendly spacing applied.</p>
        </BottomSheet>
      </>;
  }
}`,...s.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: function Action() {
    const [open, setOpen] = useState(false);
    return <>
        <Button variant="secondary" onClick={() => setOpen(true)}>Options</Button>
        <BottomSheet open={open} onClose={() => setOpen(false)} title="Choose action" showHandle>
          <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--pxd-space-2)'
        }}>
            <Button variant="primary" fullWidth onClick={() => setOpen(false)}>Save</Button>
            <Button variant="secondary" fullWidth onClick={() => setOpen(false)}>Share</Button>
            <Button variant="ghost" fullWidth onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </BottomSheet>
      </>;
  }
}`,...a.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: function Long() {
    const [open, setOpen] = useState(false);
    return <>
        <Button variant="secondary" onClick={() => setOpen(true)}>Open long content</Button>
        <BottomSheet open={open} onClose={() => setOpen(false)} title="Scrollable content" snap="large">
          <div style={{
          paddingBottom: 'var(--pxd-space-6)'
        }}>
            {Array.from({
            length: 20
          }, (_, i) => <p key={i}>Paragraph {i + 1}. Lorem ipsum dolor sit amet.</p>)}
          </div>
        </BottomSheet>
      </>;
  }
}`,...r.parameters?.docs?.source}}};const f=["BasicSheet","ActionSheetStyle","LongContentSheet"];export{a as ActionSheetStyle,s as BasicSheet,r as LongContentSheet,f as __namedExportsOrder,m as default};
