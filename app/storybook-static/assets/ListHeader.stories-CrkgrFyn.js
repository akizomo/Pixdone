import{j as e,I as c}from"./iframe-BAfEoTu4.js";import"./preload-helper-PPVm8Dsz.js";function n({title:i,showMenu:p,onMenuClick:a}){return e.jsxs("div",{className:"flex justify-between items-center mb-2",style:{padding:"var(--pd-layout-listHeader-paddingVertical, 16px) var(--pd-layout-listHeader-paddingHorizontal, 20px)"},children:[e.jsx("h2",{className:"text-[1.375rem] font-bold text-[var(--pd-color-text-primary)] tracking-[1px] m-0 pd-font-pixel uppercase",children:i}),p&&a&&e.jsx(c,{icon:e.jsx("span",{children:"⋮"}),"aria-label":"List options",onClick:a,size:"sm"})]})}n.__docgenInfo={description:"",methods:[],displayName:"ListHeader",props:{title:{required:!0,tsType:{name:"string"},description:""},showMenu:{required:!0,tsType:{name:"boolean"},description:""},onMenuClick:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""}}};const{fn:o}=__STORYBOOK_MODULE_TEST__,u={title:"PixDone/App/ListHeader",component:n,tags:["autodocs"],argTypes:{title:{control:"text"},showMenu:{control:"boolean"}},args:{onMenuClick:o()}},s={args:{title:"My Tasks",showMenu:!1}},t={args:{title:"Shopping",showMenu:!0,onMenuClick:o()}},r={args:{title:"💥 Smash List",showMenu:!1}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    title: 'My Tasks',
    showMenu: false
  }
}`,...s.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    title: 'Shopping',
    showMenu: true,
    onMenuClick: fn()
  }
}`,...t.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    title: '💥 Smash List',
    showMenu: false
  }
}`,...r.parameters?.docs?.source}}};const m=["MyTasks","WithMenu","SmashList"];export{s as MyTasks,r as SmashList,t as WithMenu,m as __namedExportsOrder,u as default};
