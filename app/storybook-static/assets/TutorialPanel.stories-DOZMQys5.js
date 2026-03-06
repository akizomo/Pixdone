import{j as e,B as d}from"./iframe-BAfEoTu4.js";import"./preload-helper-PPVm8Dsz.js";function a({headline:n,subtext:s,buttonLabel:o,onSignUp:i}){return e.jsxs("div",{className:"p-6 text-center rounded-none border-2 border-[var(--pd-color-accent-default)] bg-[var(--pd-color-background-elevated)] pd-shadow-md pd-pixel-ui",children:[e.jsx("p",{className:"text-lg font-bold text-[var(--pd-color-text-primary)] mb-2 pd-font-pixel",children:n}),e.jsx("p",{className:"text-[var(--pd-color-text-secondary)] mb-4 text-[1rem] leading-[1.4]",style:{fontFamily:"var(--pd-font-brand)"},children:s}),e.jsx(d,{variant:"primary",onClick:i,children:o})]})}a.__docgenInfo={description:"",methods:[],displayName:"TutorialPanel",props:{headline:{required:!0,tsType:{name:"string"},description:""},subtext:{required:!0,tsType:{name:"string"},description:""},buttonLabel:{required:!0,tsType:{name:"string"},description:""},onSignUp:{required:!0,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""}}};const{fn:p}=__STORYBOOK_MODULE_TEST__,l={title:"PixDone/App/TutorialPanel",component:a,tags:["autodocs"],args:{onSignUp:p()}},t={args:{headline:"You've completed the tutorial!",subtext:"Sign up to save your own tasks and sync across devices.",buttonLabel:"Sign up"}},r={args:{headline:"チュートリアル完了！",subtext:"サインアップしてタスクを保存し、デバイス間で同期しましょう。",buttonLabel:"サインアップ"}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    headline: "You've completed the tutorial!",
    subtext: 'Sign up to save your own tasks and sync across devices.',
    buttonLabel: 'Sign up'
  }
}`,...t.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    headline: 'チュートリアル完了！',
    subtext: 'サインアップしてタスクを保存し、デバイス間で同期しましょう。',
    buttonLabel: 'サインアップ'
  }
}`,...r.parameters?.docs?.source}}};const m=["English","Japanese"];export{t as English,r as Japanese,m as __namedExportsOrder,l as default};
