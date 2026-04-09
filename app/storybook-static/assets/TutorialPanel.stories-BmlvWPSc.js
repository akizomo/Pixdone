import{j as e,a as u}from"./iframe-DbiBQxMl.js";import{p as c}from"./sound-nyVtKXjL.js";import"./preload-helper-PPVm8Dsz.js";function a({headline:r,subtext:n,buttonLabel:o,onSignUp:i}){return e.jsxs("div",{className:"tutorial-complete-cta",children:[e.jsx("p",{className:"tutorial-complete-cta-text",children:r}),e.jsx("p",{className:"tutorial-complete-cta-sub",children:n}),e.jsx(u,{variant:"signup",onClick:()=>{c("buttonClick"),i()},children:o})]})}a.__docgenInfo={description:"",methods:[],displayName:"TutorialPanel",props:{headline:{required:!0,tsType:{name:"string"},description:""},subtext:{required:!0,tsType:{name:"string"},description:""},buttonLabel:{required:!0,tsType:{name:"string"},description:""},onSignUp:{required:!0,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""}}};const{fn:p}=__STORYBOOK_MODULE_TEST__,g={title:"PixDone/App/TutorialPanel",component:a,tags:["autodocs"],args:{onSignUp:p()}},t={args:{headline:"You've completed the tutorial!",subtext:"Sign up to save your own tasks and sync across devices.",buttonLabel:"Sign up"}},s={args:{headline:"チュートリアル完了！",subtext:"サインアップしてタスクを保存し、デバイス間で同期しましょう。",buttonLabel:"サインアップ"}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    headline: "You've completed the tutorial!",
    subtext: 'Sign up to save your own tasks and sync across devices.',
    buttonLabel: 'Sign up'
  }
}`,...t.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    headline: 'チュートリアル完了！',
    subtext: 'サインアップしてタスクを保存し、デバイス間で同期しましょう。',
    buttonLabel: 'サインアップ'
  }
}`,...s.parameters?.docs?.source}}};const b=["English","Japanese"];export{t as English,s as Japanese,b as __namedExportsOrder,g as default};
