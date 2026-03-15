import{M as r,r as l,j as e,a as t}from"./iframe-DbiBQxMl.js";import"./preload-helper-PPVm8Dsz.js";const p={title:"Components/ModalDialog",component:r,tags:["autodocs"],parameters:{docs:{description:{component:'**When to use:** Confirmations, forms, or focused content that must block the page. **Accessibility:** role="dialog", aria-modal, aria-labelledby/describedby; ESC closes; focus moves to first focusable inside; overlay click optional. **Visual:** Token spacing for title, description, body, actions; subtle open animation (opacity + scale).'}}}},a={render:function(){const[o,n]=l.useState(!1);return e.jsxs(e.Fragment,{children:[e.jsx(t,{variant:"primary",onClick:()=>n(!0),children:"Open dialog"}),e.jsx(r,{open:o,onClose:()=>n(!1),title:"Basic dialog",children:e.jsx("p",{children:"This is the dialog body. You can put any content here."})})]})}},i={render:function(){const[o,n]=l.useState(!1);return e.jsxs(e.Fragment,{children:[e.jsx(t,{variant:"danger",onClick:()=>n(!0),children:"Delete"}),e.jsx(r,{open:o,onClose:()=>n(!1),title:"Delete item?",description:"This action cannot be undone.",actions:e.jsxs(e.Fragment,{children:[e.jsx(t,{variant:"secondary",onClick:()=>n(!1),children:"Cancel"}),e.jsx(t,{variant:"danger",onClick:()=>n(!1),children:"Delete"})]}),children:e.jsx("p",{children:"Are you sure you want to delete this item?"})})]})}},s={render:function(){const[o,n]=l.useState(!1);return e.jsxs(e.Fragment,{children:[e.jsx(t,{variant:"secondary",onClick:()=>n(!0),children:"Open long content"}),e.jsx(r,{open:o,onClose:()=>n(!1),title:"Terms and conditions",actions:e.jsx(t,{variant:"primary",onClick:()=>n(!1),children:"I agree"}),children:e.jsxs("div",{style:{maxHeight:280,overflow:"auto"},children:[e.jsx("p",{children:"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."}),e.jsx("p",{children:"Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."}),e.jsx("p",{children:"Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur."}),e.jsx("p",{children:"Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."})]})})]})}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: function Basic() {
    const [open, setOpen] = useState(false);
    return <>
        <Button variant="primary" onClick={() => setOpen(true)}>Open dialog</Button>
        <ModalDialog open={open} onClose={() => setOpen(false)} title="Basic dialog">
          <p>This is the dialog body. You can put any content here.</p>
        </ModalDialog>
      </>;
  }
}`,...a.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: function Confirm() {
    const [open, setOpen] = useState(false);
    return <>
        <Button variant="danger" onClick={() => setOpen(true)}>Delete</Button>
        <ModalDialog open={open} onClose={() => setOpen(false)} title="Delete item?" description="This action cannot be undone." actions={<>
              <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={() => setOpen(false)}>Delete</Button>
            </>}>
          <p>Are you sure you want to delete this item?</p>
        </ModalDialog>
      </>;
  }
}`,...i.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: function Long() {
    const [open, setOpen] = useState(false);
    return <>
        <Button variant="secondary" onClick={() => setOpen(true)}>Open long content</Button>
        <ModalDialog open={open} onClose={() => setOpen(false)} title="Terms and conditions" actions={<Button variant="primary" onClick={() => setOpen(false)}>I agree</Button>}>
          <div style={{
          maxHeight: 280,
          overflow: 'auto'
        }}>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
            <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
            <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
            <p>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
          </div>
        </ModalDialog>
      </>;
  }
}`,...s.parameters?.docs?.source}}};const m=["BasicDialog","ConfirmationDialog","LongContentDialog"];export{a as BasicDialog,i as ConfirmationDialog,s as LongContentDialog,m as __namedExportsOrder,p as default};
